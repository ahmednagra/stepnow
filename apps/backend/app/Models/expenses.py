# apps/backend/app/Models/expenses.py
# Business expenses (Betriebsausgaben) imported from the legacy Buchhaltung tool.
# NOTE: amounts use Numeric(12, 4) — NOT the project's usual Numeric(10, 2) — to preserve the
# legacy values verbatim (e.g. mwstB 5.5385, brutto 34.6885), which are un-rounded VAT figures
# from the old tool. This is a deliberate, documented deviation for imported reference data;
# forward-going expenses entered in-app should be rounded to the cent.

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4
from typing import TYPE_CHECKING
from sqlalchemy import Date, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

if TYPE_CHECKING:
    from app.Models.expense_categories import ExpenseCategory


class Expense(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_date", "expense_date"),
        # category_code is indexed via index=True on its column below.
    )
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    # The legacy JSON "id" — kept as the import idempotency key (skip-if-exists).
    legacy_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, index=True)

    typ: Mapped[str] = mapped_column(String(20), nullable=False, default="Ausgabe")  # Ausgabe | Einnahme
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)                 # dat
    receipt_no: Mapped[str | None] = mapped_column(String(50), nullable=True)        # bel
    description: Mapped[str] = mapped_column(String(300), nullable=False)            # bsch

    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)      # net
    vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)         # mwstR
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)      # mwstB
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)    # brutto
    input_tax: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=Decimal("0"))  # vorsteuer

    vehicle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)     # fzName
    vehicle_type: Mapped[str | None] = mapped_column(String(10), nullable=True)      # fzTyp (firm | priv)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Bezahlt")  # stat
    category_code: Mapped[str | None] = mapped_column(String(50), ForeignKey("expense_categories.code"), nullable=True, index=True)  # kat

    km_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)         # geo
    km_occupied: Mapped[int] = mapped_column(Integer, default=0, nullable=False)      # bes
    km_empty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)         # leer
    private_km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)       # pkm
    payment_term_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # zz
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)               # faellig
    created_on: Mapped[date | None] = mapped_column(Date, nullable=True)             # erstelltAm

    # FK targets the non-PK expense_categories.code, so the join column must be named explicitly.
    category: Mapped["ExpenseCategory | None"] = relationship(
        back_populates="expenses",
        primaryjoin="Expense.category_code == ExpenseCategory.code",
        foreign_keys=[category_code],
    )
