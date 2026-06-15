# apps/backend/app/Models/vehicles.py
# Single vehicle registry for BOTH the public marketing showcase AND the operational fleet.
# A row is the public showcase when public_visible=True (B-Klasse with photos/features); a row
# is an operational fleet car when it carries a `plate` (e.g. "SN 9889"). A row can be both.
# Composite index serves the active+sort_order public listing path.

from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

if TYPE_CHECKING:
    from app.Models.orders import Order
    from app.Models.driver_vehicle_assignments import DriverVehicleAssignment


class Vehicle(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("ix_vehicles_listing", "active", "is_deleted", "sort_order"),
        # Plate lookups for the operational fleet (orders/assignments resolve cars by plate).
        Index("ix_vehicles_plate", "plate"),
    )
    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Whether this vehicle appears on the PUBLIC booking site. Operational-only fleet cars
    # (e.g. "Ersatzwagen") are kept off the showcase by setting this False while still being
    # fully usable for orders/assignments.
    public_visible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, server_default="true"
    )
    name_de: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity_passengers: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity_luggage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    features_de: Mapped[list[str]] = mapped_column(
        ARRAY(String(200)), nullable=False, default=list
    )
    features_en: Mapped[list[str]] = mapped_column(
        ARRAY(String(200)), nullable=False, default=list
    )
    image_url: Mapped[str | None] = mapped_column(String(50000), nullable=True)

    # ── Operational fleet fields (additive; nullable so pure-showcase rows are unaffected) ──
    # Registration plate / fleet identifier ("SN 9889"). Presence marks an operational car.
    plate: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # firm = company-owned, priv = private/replacement vehicle (JSON `typ`).
    ownership_type: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # ── Relationships ──
    # All jobs this car performed (the car's order history).
    orders: Mapped[list["Order"]] = relationship(
        back_populates="vehicle", foreign_keys="Order.vehicle_id"
    )
    # Every driver assigned to this car across time (weekly rotation history).
    assignments: Mapped[list["DriverVehicleAssignment"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
