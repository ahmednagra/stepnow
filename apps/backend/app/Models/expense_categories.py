# apps/backend/app/Models/expense_categories.py
# Expense classification (the KATS from the legacy Buchhaltung tool). Internal bookkeeping
# lookup. Label kept verbatim from the source (single string — the source has no EN variant);
# vst_deductible mirrors the source `katVst`.

from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class ExpenseCategory(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "expense_categories"
    __table_args__ = (
        Index("ix_expense_categories_listing", "active", "is_deleted", "sort_order"),
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)   # e.g. "kraftstoff"
    label: Mapped[str] = mapped_column(String(100), nullable=False)                          # e.g. "⛽ Kraftstoff" (verbatim)
    paragraph: Mapped[str | None] = mapped_column(String(50), nullable=True)                 # e.g. "§4 EStG"
    vst_deductible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)      # katVst
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
