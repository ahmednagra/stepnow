# apps/backend/app/Services/InvoicesService.py
# Optional billing: generate an Invoice from an Order. Money + numbering via app.Utils.finance.

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.orders import Order
from app.Models.invoices import Invoice, InvoiceItem
from app.Services.AuditService import AuditService
from app.Utils.finance import compute_totals, invoice_number_from_order, money


class InvoicesService:

    @staticmethod
    def _snapshot(inv: Invoice) -> dict:
        return {
            "invoice_number": inv.invoice_number, "status": inv.status,
            "order_id": str(inv.order_id), "net_amount": str(inv.net_amount),
            "gross_amount": str(inv.gross_amount),
        }

    @staticmethod
    def _recompute(inv: Invoice) -> None:
        """Roll base_net + line items into the stored net/vat/gross totals.
        net = base_net + Σ(charge) − Σ(discount); vat = net × rate; gross = net + vat."""
        adjust = sum(
            (item.net_amount if item.kind == "charge" else -item.net_amount)
            for item in inv.items if not item.is_deleted
        )
        inv.net_amount, inv.vat_amount, inv.gross_amount = compute_totals(
            Decimal(inv.base_net) + Decimal(adjust), inv.vat_rate
        )

    @staticmethod
    def create_from_order(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Invoice:
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.is_deleted == False)  # noqa: E712
            .first()
        )
        if not order:
            raise NotFoundError("Order not found", order_id=str(order_id))

        existing = db.query(Invoice).filter(Invoice.order_id == order_id, Invoice.is_deleted == False).first()
        if existing:
            return existing

        issue = payload.issue_date or date.today()
        rate = order.vat_rate
        base, vat, gross = compute_totals(order.net_amount, rate)

        invoice = Invoice(
            invoice_number=invoice_number_from_order(order.order_number),
            order_id=order.id,
            status="draft",
            issue_date=issue,
            recipient_block=payload.recipient_block,
            tax_number=payload.tax_number,
            base_net=base, net_amount=base, vat_rate=rate, vat_amount=vat, gross_amount=gross,
            skonto_pct=payload.skonto_pct,
            skonto_days=payload.skonto_days,
            payment_due_days=payload.payment_due_days,
            due_date=issue + timedelta(days=payload.payment_due_days),
        )
        db.add(invoice)
        db.flush()

        # NOTE: the draft→dispatched delivery-lifecycle transition is intentionally NOT done
        # here. Issuing the invoice is a billing event; the parcel is "dispatched" only when
        # the driver is actually notified, which CourierController.send owns (it sets
        # delivery_status="dispatched" + dispatched_at when the driver slip is emailed).

        AuditService.log(db, actor, "invoices", str(invoice.id), "create", None, InvoicesService._snapshot(invoice), request)
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get(db: Session, invoice_id: UUID) -> Invoice:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.is_deleted == False).first()  # noqa: E712
        if not inv:
            raise NotFoundError("Invoice not found", invoice_id=str(invoice_id))
        return inv

    @staticmethod
    def update(db: Session, invoice_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Invoice:
        """Edit a bill before or after issue (no lock). Replace-all line items; recompute totals.
        Order amounts are never touched — the vehicle account stays frozen."""
        inv = InvoicesService.get(db, invoice_id)
        before = InvoicesService._snapshot(inv)
        data = payload.model_dump(exclude_unset=True)
        items = data.pop("items", None)
        for field in ("recipient_block", "tax_number", "issue_date", "payment_due_days",
                      "base_net", "vat_rate", "skonto_pct", "skonto_days"):
            if field in data:
                setattr(inv, field, data[field])
        if "payment_due_days" in data or "issue_date" in data:
            inv.due_date = inv.issue_date + timedelta(days=inv.payment_due_days)
        if items is not None:
            inv.items.clear()
            db.flush()
            for i, it in enumerate(items):
                inv.items.append(InvoiceItem(
                    kind=it["kind"], label=it["label"], net_amount=money(it["net_amount"]),
                    sort_order=it.get("sort_order", i),
                ))
        InvoicesService._recompute(inv)
        AuditService.log(db, actor, "invoices", str(inv.id), "update", before, InvoicesService._snapshot(inv), request)
        db.commit()
        db.refresh(inv)
        return inv

    @staticmethod
    def list_invoices(db: Session, page: int, size: int, status: str | None, q: str | None):
        from app.Models.customers import Customer
        query = (
            db.query(Invoice)
            .join(Order, Invoice.order_id == Order.id)
            .outerjoin(Customer, Order.customer_id == Customer.id)
            .filter(Invoice.is_deleted == False)  # noqa: E712
        )
        if status:
            query = query.filter(Invoice.status == status)
        if q:
            like = f"%{q.strip()}%"
            query = query.filter(
                (Invoice.invoice_number.ilike(like)) | (Order.customer_name.ilike(like))
            )
        total = query.count()
        items = query.order_by(Invoice.issue_date.desc(), Invoice.invoice_number.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def mark_paid(db: Session, invoice_id: UUID, actor: AdminUser, request: Request) -> Invoice:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.is_deleted == False).first()  # noqa: E712
        if not inv:
            raise NotFoundError("Invoice not found", invoice_id=str(invoice_id))
        before = InvoicesService._snapshot(inv)
        inv.status = "paid"
        inv.paid_at = datetime.now(timezone.utc)
        AuditService.log(db, actor, "invoices", str(inv.id), "update", before, InvoicesService._snapshot(inv), request)
        db.commit()
        db.refresh(inv)
        return inv
