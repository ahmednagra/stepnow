# apps/backend/app/Models/payments.py
# A payment received against an Order (and optionally tied to a specific Invoice).
# DESIGN: orders/invoices intentionally carry NO "paid" boolean. Paid-status and
# outstanding balance are DERIVED from the sum of received payments — single source of
# truth, which gives partial payments / deposits / refunds for free without flag drift.
# Payment method is a constrained string (matches the booking.status convention), not a
# lookup table; labels already live as pricing.payment.* UI strings.

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Payment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "payments"
    __table_args__ = (
        # order_id / invoice_id are indexed via index=True on their columns below.
        Index("ix_payments_received", "received_at"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)

    # A payment is always for a job (order). The invoice link is optional: cash jobs are paid
    # without an invoice; B2B jobs are paid against a specific one.
    order_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(20), nullable=False, default="cash")       # cash | girocard | bank_transfer | paypal | other
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="received", index=True)  # received | pending | refunded | failed

    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)  # bank txn / receipt no.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payments")
    invoice: Mapped["Invoice | None"] = relationship(back_populates="payments")
