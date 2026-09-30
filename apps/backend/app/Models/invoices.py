# apps/backend/app/Models/invoices.py
# Optional billing document generated from an Order (Naeem: "...and optional billing").
# One LIVE invoice per order (partial unique on order_id, excluding cancelled); a Storno keeps the
# cancelled row and its replacement takes the next '-{revision}' number. All money is Numeric.
# invoice_number is unique and sequential (§14 UStG), generated server-side in InvoicesService.

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import (
    text,
    Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base, live_unique
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Invoice(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "invoices"
    __table_args__ = (
        live_unique("uq_invoices_order_id_live", "order_id", where="is_deleted = false AND status <> 'cancelled'"),
        Index("ix_invoices_order_id", "order_id"),
        live_unique("uq_invoices_number_live", "invoice_number"),
        Index("ix_invoices_status_issue", "status", "issue_date"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_number: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    order_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)  # indexed by uq_invoices_order_id; RESTRICT: a Beleg outlives any order delete attempt

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)  # draft | issued | paid | cancelled
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Recipient block (multi-line: name / z.Hd. / street / PLZ Ort) snapshotted at issue time.
    recipient_block: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Money ── base_net is the editable base service price (seeded from the order). The stored
    # net/vat/gross are the COMPUTED totals: net = base_net + Σ(charge items) − Σ(discount items).
    base_net: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, server_default=text("'EUR'"),
        comment="ISO 4217 — resolved from site_settings.default_currency at write time"
    )
    vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0700"))
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Early-payment discount (Skonto). Ad-hoc charges/discounts are rows in invoice_items.
    skonto_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    skonto_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Payment terms
    payment_due_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Where the rendered PDF lives once generated (uploads/storage path or URL).
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    storno_pdf_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
        comment="Stornorechnung PDF, rendered once when the invoice is cancelled; never regenerated",
    )
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="invoices")
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")
    # Ad-hoc charge/discount lines (Waiting Time, Zuschlag, Rabatt …). Replace-all on edit.
    items: Mapped[list["InvoiceItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.sort_order"
    )


class InvoiceItem(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "invoice_items"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String(10), nullable=False, comment="charge | discount")
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, comment="Always positive; a discount subtracts from the total"
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")
