# apps/backend/app/Models/pricing.py
# Pricing categories and items with composite indexes for filtered listing paths.

from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String, text
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
    prices_net: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false"),
        comment="True = prices are quoted net, plus statutory VAT (B2B courier); false = Endpreise incl. VAT"
    )
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
    # NULL = "Preis auf Anfrage": the offering is listed, the fare is quoted per request.
    price_eur: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    price_unit: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="NULL = flat price; 'km' / 'min' = rate per kilometre / minute"
    )
    is_from_price: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false"),
        comment="True = a starting price, rendered as 'ab …'"
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="EUR", server_default=text("'EUR'"),
        comment="ISO 4217 unit for price_eur — the column name predates multi-currency"
    )
    distance_km: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2), nullable=True, comment="Optional route distance shown next to the price"
    )
    note_de: Mapped[str | None] = mapped_column(String(500), nullable=True)
    note_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped["PricingCategory"] = relationship(back_populates="items")
