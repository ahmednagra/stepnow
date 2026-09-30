# apps/backend/app/Services/PaymentsService.py
# Records payments and DERIVES paid-status/balance from the sum of received payments
# (no stored "paid" flag). Same static-method + AuditService pattern as the other services.
#
# Settlement rule: an order with a live invoice is settled when the payments LINKED to that invoice
# cover the INVOICE gross (charges/discounts included); without one, when the order's received
# payments cover the order gross. sync_states() re-derives invoice paid/issued and order
# completed/open from the ledger after every change, so a refund un-settles exactly as a payment
# settles. A payment may not exceed the open balance — an overpayment is refused (409), not banked.

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import InstrumentedAttribute, Session
from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.orders import Order
from app.Models.invoices import Invoice
from app.Models.payments import Payment
from app.Services.AuditService import AuditService
from app.Utils.finance import money


class PaymentsService:

    @staticmethod
    def _received(db: Session, *criteria) -> Decimal:
        total = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(*criteria, Payment.status == "received", Payment.is_deleted == False)  # noqa: E712
            .scalar()
        )
        return money(total or 0)

    @staticmethod
    def received_total(db: Session, order_id: UUID) -> Decimal:
        return PaymentsService._received(db, Payment.order_id == order_id)

    @staticmethod
    def invoice_received_total(db: Session, invoice_id: UUID) -> Decimal:
        return PaymentsService._received(db, Payment.invoice_id == invoice_id)

    @staticmethod
    def billed_gross(order: Order) -> Decimal:
        """What the customer owes: the live invoice's gross when billed, else the order gross."""
        inv = order.current_invoice
        return inv.gross_amount if inv else order.gross_amount

    @staticmethod
    def _grouped(db: Session, key: InstrumentedAttribute, ids: list[UUID]) -> dict[UUID, Decimal]:
        # One grouped SUM for a page of rows — avoids a per-row query in list views.
        if not ids:
            return {}
        rows = (
            db.query(key, func.coalesce(func.sum(Payment.amount), 0))
            .filter(key.in_(ids), Payment.status == "received", Payment.is_deleted == False)  # noqa: E712
            .group_by(key)
            .all()
        )
        return {k: money(total) for k, total in rows}

    @staticmethod
    def totals_for(db: Session, order_ids: list[UUID]) -> dict[UUID, Decimal]:
        return PaymentsService._grouped(db, Payment.order_id, order_ids)

    @staticmethod
    def invoice_totals_for(db: Session, invoice_ids: list[UUID]) -> dict[UUID, Decimal]:
        return PaymentsService._grouped(db, Payment.invoice_id, invoice_ids)

    @staticmethod
    def list_for_order(db: Session, order_id: UUID) -> list[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.order_id == order_id, Payment.is_deleted == False)  # noqa: E712
            .order_by(Payment.received_at.desc())
            .all()
        )

    @staticmethod
    def sync_states(db: Session, order: Order) -> None:
        """Re-derive invoice paid/issued and order completed/open from the ledger. A cancelled order
        and a draft invoice keep their status — only the settled/unsettled pair is derived."""
        db.flush()
        inv = order.current_invoice
        paid = PaymentsService.invoice_received_total(db, inv.id) if inv else PaymentsService.received_total(db, order.id)
        settled = paid >= PaymentsService.billed_gross(order)
        now = datetime.now(timezone.utc)
        if inv and inv.status in ("issued", "paid"):
            inv.status, inv.paid_at = ("paid", inv.paid_at or now) if settled else ("issued", None)
        if settled and order.status == "open":
            order.status, order.completed_at = "completed", order.completed_at or now
        elif not settled and order.status == "completed":
            order.status, order.completed_at = "open", None

    @staticmethod
    def _locked_order(db: Session, order_id: UUID) -> Order:
        # Row lock serialises concurrent payments on one order, so the balance check can't race.
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.is_deleted == False)  # noqa: E712
            .with_for_update()
            .first()
        )
        if not order:
            raise NotFoundError("Order not found", order_id=str(order_id))
        return order

    @staticmethod
    def _target_invoice(db: Session, order: Order, invoice_id: UUID | None) -> Invoice | None:
        if invoice_id is None:
            return order.current_invoice
        inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.is_deleted == False).first()  # noqa: E712
        if not inv or inv.order_id != order.id:
            raise ConflictError("Invoice does not belong to this order", invoice_id=str(invoice_id), order_id=str(order.id))
        if inv.status == "cancelled":
            raise ConflictError(
                "Invoice is cancelled (Storno) — record the payment against its replacement",
                invoice_id=str(invoice_id),
            )
        return inv

    @staticmethod
    def _guard_balance(db: Session, order: Order, inv: Invoice | None, amount: Decimal) -> None:
        open_balance = money(
            inv.gross_amount - PaymentsService.invoice_received_total(db, inv.id) if inv
            else order.gross_amount - PaymentsService.received_total(db, order.id)
        )
        if amount > open_balance:
            raise ConflictError(
                f"Payment of {amount} exceeds the open balance of {open_balance}",
                open_balance=str(open_balance),
            )

    @staticmethod
    def record(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Payment:
        order = PaymentsService._locked_order(db, order_id)
        inv = PaymentsService._target_invoice(db, order, payload.invoice_id)
        amount, status = money(payload.amount), payload.status or "received"
        if status == "received":
            PaymentsService._guard_balance(db, order, inv, amount)
        payment = Payment(
            order_id=order.id,
            invoice_id=inv.id if inv else None,
            amount=amount,
            currency=order.currency,
            method=payload.method,
            status=status,
            received_at=payload.received_at or datetime.now(timezone.utc),
            reference=payload.reference,
            notes=payload.notes,
        )
        db.add(payment)
        PaymentsService.sync_states(db, order)
        AuditService.log(
            db, actor, "payments", str(payment.id), "create", None,
            {"order_id": str(order.id), "invoice_id": str(payment.invoice_id) if payment.invoice_id else None,
             "amount": str(payment.amount), "method": payment.method, "status": payment.status},
            request,
        )
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def set_status(db: Session, payment_id: UUID, new_status: str, actor: AdminUser, request: Request | None = None) -> Payment:
        """pending → received | failed, received → refunded. A refund is a status change on the
        original row (the ledger keeps it), and the derived states follow."""
        p = db.query(Payment).filter(Payment.id == payment_id, Payment.is_deleted == False).first()  # noqa: E712
        if not p:
            raise NotFoundError("Payment not found", payment_id=str(payment_id))
        order = PaymentsService._locked_order(db, p.order_id)
        if new_status not in {"pending": ("received", "failed"), "received": ("refunded",)}.get(p.status, ()):
            raise ConflictError(f"A {p.status} payment cannot be marked {new_status}", payment_id=str(payment_id))
        before = {"status": p.status, "invoice_id": str(p.invoice_id) if p.invoice_id else None}
        if new_status == "received":
            inv = p.invoice or order.current_invoice
            PaymentsService._guard_balance(db, order, inv, p.amount)
            p.invoice_id = inv.id if inv else None
        p.status = new_status
        PaymentsService.sync_states(db, order)
        AuditService.log(
            db, actor, "payments", str(p.id), "update", before,
            {"status": p.status, "invoice_id": str(p.invoice_id) if p.invoice_id else None}, request,
        )
        db.commit()
        db.refresh(p)
        return p
