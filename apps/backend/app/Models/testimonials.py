# apps/backend/app/Models/testimonials.py
# Customer testimonials with composite index for the active+sort_order listing path.

from datetime import date
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Date, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Testimonial(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "testimonials"
    __table_args__ = (
        Index("ix_testimonials_listing", "active", "is_deleted", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    author_role_de: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_role_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quote_de: Mapped[str] = mapped_column(Text, nullable=False)
    quote_en: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_given: Mapped[date | None] = mapped_column(Date, nullable=True)
    author_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
