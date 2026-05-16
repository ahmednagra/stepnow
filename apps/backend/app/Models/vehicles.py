# apps/backend/app/Models/vehicles.py
# Fleet inventory with composite index for the active+sort_order listing path.

from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Vehicle(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("ix_vehicles_listing", "active", "is_deleted", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    name_de: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity_passengers: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity_luggage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    features_de: Mapped[list[str]] = mapped_column(ARRAY(String(200)), nullable=False, default=list)
    features_en: Mapped[list[str]] = mapped_column(ARRAY(String(200)), nullable=False, default=list)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
