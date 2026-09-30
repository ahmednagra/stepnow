# apps/backend/app/Models/services.py
# Service catalog with composite index for the active+sort_order listing path.

from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base, live_unique
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin
from app.Mixins.SeedManagedMixin import SeedManagedMixin


class Service(Base, TimestampMixin, SoftDeleteMixin, SeedManagedMixin):
    __tablename__ = "services"
    __table_args__ = (
        Index("ix_services_listing", "active", "is_deleted", "sort_order"),
        live_unique("uq_services_slug_de_live", "slug_de"),
        live_unique("uq_services_slug_en_live", "slug_en"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vat_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True, comment="Per-service VAT rate; NULL falls back to site_settings"
    )
    slug_de: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug_en: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title_de: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), nullable=False)
    short_description_de: Mapped[str | None] = mapped_column(String(500), nullable=True)
    short_description_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    long_description_de: Mapped[str | None] = mapped_column(Text, nullable=True)
    long_description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_title_de: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_title_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description_de: Mapped[str | None] = mapped_column(String(300), nullable=True)
    meta_description_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    seed_key: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Stable identity of a seeded service (its original slug_de); NULL for admin-created services. Survives admin slug edits")
