# apps/backend/app/Models/faqs.py
# FAQ entries with composite index for the active+category+sort_order listing path.

from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin
from app.Mixins.SeedManagedMixin import SeedManagedMixin


class Faq(Base, TimestampMixin, SoftDeleteMixin, SeedManagedMixin):
    __tablename__ = "faqs"
    __table_args__ = (
        Index("ix_faqs_listing", "active", "is_deleted", "category", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general", index=True)
    question_de: Mapped[str] = mapped_column(String(500), nullable=False)
    question_en: Mapped[str] = mapped_column(String(500), nullable=False)
    answer_de: Mapped[str] = mapped_column(Text, nullable=False)
    answer_en: Mapped[str] = mapped_column(Text, nullable=False)
    seed_key: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Stable identity of a seeded FAQ (seed_faqs key); NULL for admin-created FAQs. Survives admin edits to the question text")
