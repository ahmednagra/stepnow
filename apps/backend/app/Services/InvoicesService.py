# apps/backend/app/Services/InvoicesService.py
# Optional billing: generate an Invoice from an Order. Money + numbering via app.Utils.finance.
#
# Lifecycle: draft → issued → paid (derived from the ledger, see PaymentsService.sync_states), or
# cancelled (Storno). A draft is freely editable and its PDF renders on demand. issue() validates
# the §14 UStG basics, stamps today's date and renders the PDF ONCE — that file is the Buchungsbeleg
# and is never regenerated. Storno policy: received/pending payments linked to the cancelled bill
# are detached (kept on the order as credit, audited) and applied to the replacement when it is
# created; the replacement takes the next '-{revision}' number and starts as a copy of the Storno.
# cancel() renders the Stornorechnung ('{number}-STORNO', negated amounts) once, like issue().

from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager
from app.Core.Exceptions import AppError, ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.orders import Order
from app.Models.invoices import Invoice, InvoiceItem
from app.Models.payments import Payment
from app.Models.settings import SiteSettings
from app.Services.AuditService import AuditService
from app.Services.InvoicePdfService import InvoicePdfService
from app.Services.PaymentsService import PaymentsService
from app.Utils.finance import compute_totals, money, next_invoice_number
from app.Utils.Logger import get_logger

logger = get_logger("invoices_service")


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
        adjust = sum(
            (item.net_amount if item.kind == "charge" else -item.net_amount)
            for item in inv.items if not item.is_deleted
        )
        inv.net_amount, inv.vat_amount, inv.gross_amount = compute_totals(
            Decimal(inv.base_net) + Decimal(adjust), inv.vat_rate
        )

    @staticmethod
    def _default_recipient(order: Order) -> str | None:
        c = order.customer
        lines = [order.company_name or order.customer_name]
        if c:
            lines += [f"z. Hd. {c.contact_person}" if c.contact_person else None, c.street, " ".join(p for p in (c.plz, c.ort) if p)]
        return "\n".join(line for line in lines if line) or None

    @staticmethod
    def create_from_order(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Invoice:
        # Row lock: a double-click waits here, then finds the first click's invoice and returns it.
        order = db.query(Order).filter(Order.id == order_id, Order.is_deleted == False).with_for_update().first()  # noqa: E712
        if not order:
            raise NotFoundError("Order not found", order_id=str(order_id))
        if order.current_invoice:
            return order.current_invoice
        if order.status == "cancelled":
            raise ConflictError("A cancelled order cannot be billed", order_id=str(order_id))
        # A replacement after a Storno starts as a copy of the cancelled bill, so only the error needs fixing.
        prev = next((i for i in reversed(order.invoices) if not i.is_deleted and i.status == "cancelled"), None)
        def pick(field: str, fallback):
            given = getattr(payload, field)
            return given if given is not None else (getattr(prev, field) if prev else fallback)
        issue = payload.issue_date or date.today()
        invoice = Invoice(
            order=order,
            invoice_number=next_invoice_number(db, order.order_number),
            status="draft",
            issue_date=issue,
            recipient_block=pick("recipient_block", InvoicesService._default_recipient(order)),
            tax_number=pick("tax_number", None),
            base_net=money(prev.base_net if prev else order.net_amount),
            vat_rate=prev.vat_rate if prev else order.vat_rate,
            currency=order.currency,
            skonto_pct=pick("skonto_pct", None),
            skonto_days=pick("skonto_days", None),
            payment_due_days=payload.payment_due_days,
            due_date=issue + timedelta(days=payload.payment_due_days),
            items=[
                InvoiceItem(kind=it.kind, label=it.label, net_amount=it.net_amount, sort_order=it.sort_order)
                for it in (prev.items if prev else []) if not it.is_deleted
            ],
        )
        InvoicesService._recompute(invoice)
        db.add(invoice)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            existing = db.query(Invoice).filter(
                Invoice.order_id == order_id, Invoice.is_deleted == False, Invoice.status != "cancelled"  # noqa: E712
            ).first()
            if existing:
                return existing
            raise ConflictError("The invoice could not be created — please retry", order_id=str(order_id))
        # Credit already on the order (cash paid up front, or detached by a Storno) settles this bill.
        moved = db.query(Payment).filter(
            Payment.order_id == order.id, Payment.invoice_id.is_(None), Payment.is_deleted == False,  # noqa: E712
            Payment.status.in_(("received", "pending")),
        ).update({Payment.invoice_id: invoice.id}, synchronize_session=False)
        if moved:
            PaymentsService.sync_states(db, order)
        AuditService.log(db, actor, "invoices", str(invoice.id), "create", None,
                         {**InvoicesService._snapshot(invoice), "payments_linked": moved}, request)
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
        """Draft-only. Once issued, an invoice is a Buchungsbeleg (GoBD §§146/147 AO):
        correct it with cancel() + a fresh invoice, never by rewriting it in place."""
        inv = InvoicesService.get(db, invoice_id)
        if inv.status != "draft":
            raise ConflictError(
                "Invoice is no longer a draft and cannot be edited. Cancel it and issue a replacement.",
                invoice_id=str(invoice_id), status=inv.status,
            )
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
    def issue(db: Session, invoice_id: UUID, actor: AdminUser, request: Request | None = None) -> Invoice:
        inv = InvoicesService.get(db, invoice_id)
        if inv.status != "draft":
            raise ConflictError("Only a draft invoice can be issued.", invoice_id=str(invoice_id), status=inv.status)
        # §14 Abs. 4 UStG basics — the rest (issuer, number, amounts, VAT) is guaranteed by construction.
        if len([line for line in (inv.recipient_block or "").splitlines() if line.strip()]) < 2:
            raise ConflictError(
                "The recipient needs a name and a full address (at least two lines) before the invoice can be issued (§14 UStG).",
                invoice_id=str(invoice_id), field="recipient_block",
            )
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
        if not (inv.tax_number or (s and (s.tax_number or s.vat_id))):
            raise ConflictError(
                "Set the issuer's Steuer-Nr. or USt-IdNr. (Settings) before issuing an invoice (§14 UStG).",
                invoice_id=str(invoice_id), field="tax_number",
            )
        if not inv.invoice_number or inv.gross_amount < 0:
            raise ConflictError("The invoice has no number or a negative total and cannot be issued.", invoice_id=str(invoice_id))
        before = InvoicesService._snapshot(inv)
        today = date.today()
        if inv.issue_date != today:
            inv.issue_date, inv.due_date = today, today + timedelta(days=inv.payment_due_days)
        inv.status = "issued"
        PaymentsService.sync_states(db, inv.order)
        # Freeze the document now. No PDF, no issue — an issued bill must have its Beleg.
        try:
            inv.pdf_url = InvoicePdfService.render(db, inv)
        except Exception as e:
            db.rollback()
            logger.error(f"[Invoices.issue] PDF render failed for {inv.invoice_number}: {e}")
            raise AppError("Failed to render the invoice PDF — the invoice was not issued.")
        AuditService.log(db, actor, "invoices", str(inv.id), "issue", before, InvoicesService._snapshot(inv), request)
        db.commit()
        db.refresh(inv)
        return inv

    @staticmethod
    def cancel(db: Session, invoice_id: UUID, actor: AdminUser, request: Request | None = None, reason: str | None = None) -> Invoice:
        """Storno. The number is retired, never reused; a replacement gets the next revision."""
        inv = InvoicesService.get(db, invoice_id)
        if inv.status not in ("issued", "paid"):
            raise ConflictError(
                "Only an issued invoice can be cancelled (Storno). A draft is still editable.",
                invoice_id=str(invoice_id), status=inv.status,
            )
        before = InvoicesService._snapshot(inv)
        detached = db.query(Payment).filter(
            Payment.invoice_id == inv.id, Payment.is_deleted == False, Payment.status.in_(("received", "pending"))  # noqa: E712
        ).all()
        for p in detached:
            p.invoice_id = None
        inv.status = "cancelled"
        if reason:
            inv.internal_notes = f"{inv.internal_notes}\n{reason}".strip() if inv.internal_notes else reason
        PaymentsService.sync_states(db, inv.order)
        # Freeze the Stornorechnung with the cancellation — no document, no Storno.
        try:
            inv.storno_pdf_url = InvoicePdfService.render(db, inv, storno=True)
        except Exception as e:
            db.rollback()
            logger.error(f"[Invoices.cancel] Storno PDF render failed for {inv.invoice_number}: {e}")
            raise AppError("Failed to render the Stornorechnung — the invoice was not cancelled.")
        AuditService.log(db, actor, "invoices", str(inv.id), "cancel", before,
                         {**InvoicesService._snapshot(inv), "payments_detached": [str(p.id) for p in detached]}, request)
        db.commit()
        db.refresh(inv)
        return inv

    @staticmethod
    def list_invoices(db: Session, page: int, size: int, status: str | None, q: str | None):
        query = (
            db.query(Invoice)
            .join(Order, Invoice.order_id == Order.id)
            .options(contains_eager(Invoice.order))
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
