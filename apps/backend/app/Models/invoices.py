# apps/backend/app/Models/invoices.py

# One invoice per order (unique order_id); relax to one-to-many later if credit notes /
# partial invoices are ever needed. All money is Numeric. invoice_number is unique and
# sequential (§14 UStG), generated server-side in InvoicesService.

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Invoice(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("order_id", name="uq_invoices_order_id"),
        Index("ix_invoices_status_issue", "status", "issue_date"),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    invoice_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )
    order_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )  # draft | issued | paid | cancelled
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Recipient block (multi-line: name / z.Hd. / street / PLZ Ort) snapshotted at issue time.
    recipient_block: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Money ──
    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.0700")
    )
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Optional surcharge line (Zuschlag) and early-payment discount (Skonto).
    surcharge_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    surcharge_net: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    skonto_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    skonto_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Payment terms
    payment_due_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Where the rendered PDF lives once generated (uploads/storage path or URL).
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="invoice")
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")
