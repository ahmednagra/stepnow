# apps/backend/app/Models/drivers.py
# A courier/transport driver. New entity for the parcel-dispatch feature: orders previously
# carried only a free-text driver_name string; a real table gives a Drivers record hub
# (job history, contact, the email address the Fahrauftrag is sent to). Soft-deletable and
# audited like every other admin-managed entity.

from uuid import UUID, uuid4
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


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

    orders: Mapped[list["Order"]] = relationship(back_populates="driver")  # noqa: F821
