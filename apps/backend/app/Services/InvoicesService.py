# apps/backend/app/Services/InvoicesService.py
# Optional billing: generate an Invoice from an Order. Money + numbering via app.Utils.finance.

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.orders import Order
from app.Models.invoices import Invoice
from app.Services.AuditService import AuditService
from app.Utils.finance import compute_totals, money, next_sequence_number, year_prefix


class InvoicesService:

    @staticmethod
    def _snapshot(inv: Invoice) -> dict:
        return {
            "invoice_number": inv.invoice_number, "status": inv.status,
            "order_id": str(inv.order_id), "net_amount": str(inv.net_amount),
            "gross_amount": str(inv.gross_amount),
        }

    @staticmethod
    def create_from_order(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Invoice:
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.is_deleted == False)  # noqa: E712
            .first()
        )
        if not order:
            raise NotFoundError("Order not found", order_id=str(order_id))

        if db.query(Invoice).filter(Invoice.order_id == order_id).first():
            existing = db.query(Invoice).filter(Invoice.order_id == order_id).first()
            raise ConflictError("Order already has an invoice", invoice_number=existing.invoice_number)

        issue = payload.issue_date or date.today()
        rate = order.vat_rate
        surcharge_net = money(payload.surcharge_net) if payload.surcharge_net else Decimal("0.00")
        net, vat, gross = compute_totals(order.net_amount + surcharge_net, rate)

        invoice = Invoice(
            invoice_number=next_sequence_number(db, Invoice.invoice_number, year_prefix("R")),
            order_id=order.id,
            status="draft",
            issue_date=issue,
            recipient_block=payload.recipient_block,
            tax_number=payload.tax_number,
            net_amount=net, vat_rate=rate, vat_amount=vat, gross_amount=gross,
            surcharge_label=payload.surcharge_label,
            surcharge_net=(surcharge_net or None),
            skonto_pct=payload.skonto_pct,
            skonto_days=payload.skonto_days,
            payment_due_days=payload.payment_due_days,
            due_date=issue + timedelta(days=payload.payment_due_days),
        )
        db.add(invoice)
        db.flush()
        AuditService.log(db, actor, "invoices", str(invoice.id), "create", None, InvoicesService._snapshot(invoice), request)
        db.commit()
        db.refresh(invoice)
        return invoice

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
