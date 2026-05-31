# apps/backend/app/Models/orders.py
# Orders created by converting a booking_request (Naeem: "booking auto convert to order").
# Unlike booking_requests (lead capture, price stored loosely as String), an Order is a
# financial record: money is Numeric and the customer/route/schedule are SNAPSHOTTED at
# conversion so later edits to the source booking never mutate a placed order.
# A unique (nullable) booking_id enforces one order per booking — Postgres allows multiple
# NULLs, so manually-created orders without a booking still work.

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_orders_booking_id"),
        Index("ix_orders_status_created", "status", "created_at"),
        Index("ix_orders_scheduled", "scheduled_datetime"),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    order_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )

    booking_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("booking_requests.id"),
        nullable=True,
        index=True,
    )
    service_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True
    )
    vehicle_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="open", index=True
    )  # open | completed | cancelled

    # ── Customer snapshot (copied at conversion, immutable afterward) ──
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(200), nullable=False)
    is_business: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_vatid: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Route / schedule snapshot ──
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    pickup_postcode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    pickup_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination_address: Mapped[str] = mapped_column(String(500), nullable=False)
    destination_postcode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    destination_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    scheduled_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    passenger_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    luggage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    distance_km: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)

    driver_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    service_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.0700")
    )
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # ── Payment terms (§ 271 BGB) ──
    payment_due_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Optional billing — at most one invoice per order.
    invoice: Mapped["Invoice | None"] = relationship(
        back_populates="order", uselist=False, cascade="all, delete-orphan"
    )
    # Payment ledger — paid-status/balance are DERIVED from these, never stored as a flag.
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
