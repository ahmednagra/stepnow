# apps/backend/app/Services/PaymentsService.py
# Records payments and DERIVES paid-status/balance from the sum of received payments
# (no stored "paid" flag). Same static-method + AuditService pattern as the other services.

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.orders import Order
from app.Models.invoices import Invoice
from app.Models.payments import Payment
from app.Services.AuditService import AuditService
from app.Utils.finance import money


class PaymentsService:

    @staticmethod
    def received_total(db: Session, order_id: UUID) -> Decimal:
        total = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.order_id == order_id,
                Payment.status == "received",
                Payment.is_deleted == False,  # noqa: E712
            )
            .scalar()
        )
        return money(total or 0)

    @staticmethod
    def balance_due(db: Session, order: Order) -> Decimal:
        return money(order.gross_amount - PaymentsService.received_total(db, order.id))

    @staticmethod
    def list_for_order(db: Session, order_id: UUID) -> list[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.order_id == order_id, Payment.is_deleted == False)  # noqa: E712
            .order_by(Payment.received_at.desc())
            .all()
        )

    @staticmethod
    def record(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Payment:
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.is_deleted == False)  # noqa: E712
            .first()
        )
        if not order:
            raise NotFoundError("Order not found", order_id=str(order_id))

        payment = Payment(
            order_id=order.id,
            invoice_id=payload.invoice_id,
            amount=money(payload.amount),
            method=payload.method,
            status=payload.status or "received",
            received_at=payload.received_at or datetime.now(timezone.utc),
            reference=payload.reference,
            notes=payload.notes,
        )
        db.add(payment)
        db.flush()

        # When fully settled, advance derived states (no stored "paid" flag on the order;
        # invoice gets an explicit status so its document lifecycle is queryable).
        if PaymentsService.balance_due(db, order) <= Decimal("0.00"):
            if order.status == "open":
                order.status = "completed"
                order.completed_at = order.completed_at or datetime.now(timezone.utc)
            inv = payment.invoice or (order.invoice if order.invoice else None)
            if inv and inv.status != "paid":
                inv.status = "paid"
                inv.paid_at = datetime.now(timezone.utc)

        AuditService.log(
            db, actor, "payments", str(payment.id), "create", None,
            {"order_id": str(order.id), "amount": str(payment.amount), "method": payment.method},
            request,
        )
        db.commit()
        db.refresh(payment)
        return payment
