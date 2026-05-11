# apps/backend/app/Models/services.py
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Service(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "services"
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    slug_de: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug_en: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
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
