# apps/backend/app/Models/ui_strings.py
from uuid import UUID, uuid4
from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base, live_unique
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin
from app.Mixins.SeedManagedMixin import SeedManagedMixin


class UiString(Base, TimestampMixin, SoftDeleteMixin, SeedManagedMixin):
    __tablename__ = "ui_strings"
    __table_args__ = (live_unique("uq_ui_strings_key_live", "key"),)
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    key: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    namespace: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value_de: Mapped[str] = mapped_column(Text, nullable=False)
    value_en: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
