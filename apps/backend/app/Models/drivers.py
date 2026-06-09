# apps/backend/app/Models/drivers.py
# A courier/transport driver. Now also holds the driving-licence + P-Schein compliance
# record required for §21 StVG owner-liability (Halterhaftung): the operator must verify a
# valid licence before dispatch and re-check periodically (case law: ~6 months). Licence
# classes are stored as a Postgres string array. Soft-deletable and audited like every
# other admin-managed entity.

from datetime import date
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin
from app.Models.orders import Order


class Driver(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "drivers"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    # Optional link to a fleet vehicle; the slip also snapshots a free-text label.
    vehicle_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vehicle_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Driving licence (Führerschein) — §21 StVG / §23(2) FeV ──
    license_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    license_classes: Mapped[list[str] | None] = mapped_column(ARRAY(String(8)), nullable=True)
    license_expiry: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    license_restrictions: Mapped[str | None] = mapped_column(String(300), nullable=True)

    pschein_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pschein_expiry: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    # ── §21 StVG check record (audit-proof: who/when, next due). ──
    last_license_check_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_license_check_due: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    last_checked_by: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )

    orders: Mapped[list["Order"]] = relationship(back_populates="driver")  # noqa: F821
