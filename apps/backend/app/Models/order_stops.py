# apps/backend/app/Models/order_stops.py
# Ordered route stops for an order: N pickups (Abholung) consolidated into one drop (Ziel).
# Each stop is one row, sequenced; stop_type distinguishes pickup vs drop. This table is the
# CANONICAL route — the legacy Order.pickup_address / destination_address columns are kept as a
# denormalised mirror (first pickup + the drop) so older readers keep working. Per-stop `status`
# lets a driver app advance each collection independently later.

from datetime import datetime, time
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

if TYPE_CHECKING:
    from app.Models.orders import Order


class OrderStop(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "order_stops"
    __table_args__ = (
        Index("ix_order_stops_order_sequence", "order_id", "sequence"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="Stop order: pickups 1..N, the drop last"
    )
    stop_type: Mapped[str] = mapped_column(String(20), nullable=False, comment="pickup | drop")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending",
        comment="Per-stop lifecycle: pending | arrived | completed | failed",
    )

    company: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="Firma at this stop (Beladeort/Entladeort)")
    address: Mapped[str] = mapped_column(String(500), nullable=False, comment="Straße + Hausnummer")
    postcode: Mapped[str | None] = mapped_column(String(10), nullable=True, comment="PLZ")
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Ort")
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True, comment="Latitude (optional, routing)")
    lng: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True, comment="Longitude (optional, routing)")

    contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="On-site contact (Ansprechpartner)")
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    time_from: Mapped[time | None] = mapped_column(Time, nullable=True, comment="Window start (Abhol-/Lieferzeit von)")
    time_to: Mapped[time | None] = mapped_column(Time, nullable=True, comment="Window end (bis)")
    package_count: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Items at this stop")
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Besondere Hinweise for this stop")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ──
    order: Mapped["Order"] = relationship(back_populates="stops")
