# apps/backend/app/Models/driver_vehicle_assignments.py
# History of which DRIVER drove which VEHICLE, and WHEN. This is the join that makes the fleet
# many-to-many over time:
#   • a car has many drivers          → many rows share one vehicle_id
#   • a driver rotates cars weekly     → many rows share one driver_id, each a date window
#
# An OPEN assignment (end_date IS NULL) is the driver's current car. Rotating a driver to a new
# car = close the old row (set end_date) and open a new one — the past is never overwritten, so
# historical attribution stays correct ("who drove SN 9889 in week 19?").
#
# Why this matters for tracing: the legacy orders carry NO per-order driver (StepNow_Data.json
# `fahr` is empty for all 81 jobs). Driver→order attribution is therefore DERIVED — an order is
# attributed to the driver who was assigned to that order's car on the order's date. The direct
# Order.driver_id is still honoured first when a job was explicitly booked to a driver.

from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Date, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

if TYPE_CHECKING:
    from app.Models.drivers import Driver
    from app.Models.vehicles import Vehicle


class DriverVehicleAssignment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "driver_vehicle_assignments"
    __table_args__ = (
        # Period lookups from both ends: "this driver's cars over time" and "this car's drivers".
        Index("ix_dva_driver_period", "driver_id", "start_date", "end_date"),
        Index("ix_dva_vehicle_period", "vehicle_id", "start_date", "end_date"),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    driver_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("drivers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Inclusive window. end_date NULL = still driving this car (open assignment).
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # When a car has several drivers in the same window, the primary one is the default
    # responsible party for that car's jobs.
    is_primary: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, server_default="true"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ──
    driver: Mapped["Driver"] = relationship(back_populates="vehicle_assignments")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="assignments")
