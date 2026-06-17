# apps/backend/app/Models/bookings.py
# Booking requests with composite index for status+created_at admin queries.

from datetime import datetime
from uuid import UUID, uuid4
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

if TYPE_CHECKING:
    from app.Models.services import Service


class BookingRequest(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "booking_requests"
    __table_args__ = (
        Index("ix_bookings_status_created", "status", "created_at"),
        Index("ix_bookings_created_at", "created_at"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    reference: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new", index=True)
    service_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True)
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    pickup_postcode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    pickup_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination_address: Mapped[str] = mapped_column(String(500), nullable=False)
    destination_postcode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    destination_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    requested_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    passenger_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    luggage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    special_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(200), nullable=False)
    is_business: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_vatid: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str] = mapped_column(String(2), nullable=False, default="de")
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quoted_price_eur: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quoted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # One-directional — Service is a content model that shouldn't know about bookings.
    service: Mapped["Service | None"] = relationship()
