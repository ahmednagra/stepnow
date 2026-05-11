# apps/backend/app/Models/legal_pages.py
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class LegalPage(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "legal_pages"
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    published_version_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), ForeignKey("legal_page_versions.id", use_alter=True, name="fk_legal_pages_published_version"), nullable=True)
    draft_version_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), ForeignKey("legal_page_versions.id", use_alter=True, name="fk_legal_pages_draft_version"), nullable=True)
    versions: Mapped[list["LegalPageVersion"]] = relationship(back_populates="legal_page", cascade="all, delete-orphan", foreign_keys="LegalPageVersion.legal_page_id")


class LegalPageVersion(Base, TimestampMixin):
    __tablename__ = "legal_page_versions"
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    legal_page_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("legal_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title_de: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), nullable=False)
    body_de: Mapped[str] = mapped_column(Text, nullable=False)
    body_en: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    changes_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_page: Mapped["LegalPage"] = relationship(back_populates="versions", foreign_keys=[legal_page_id])
