# apps/backend/app/Models/pricing.py
# Pricing categories and items with composite indexes for filtered listing paths.

from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class PricingCategory(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "pricing_categories"
    __table_args__ = (
        Index("ix_pricing_categories_listing", "service_id", "is_deleted", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    service_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    name_de: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    description_de: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    items: Mapped[list["PricingItem"]] = relationship(back_populates="category", cascade="all, delete-orphan")


class PricingItem(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "pricing_items"
    __table_args__ = (
        Index("ix_pricing_items_listing", "category_id", "is_deleted", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    category_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("pricing_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    from_location_de: Mapped[str | None] = mapped_column(String(200), nullable=True)
    from_location_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    to_location_de: Mapped[str | None] = mapped_column(String(200), nullable=True)
    to_location_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    price_eur: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    note_de: Mapped[str | None] = mapped_column(String(500), nullable=True)
    note_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped["PricingCategory"] = relationship(back_populates="items")
