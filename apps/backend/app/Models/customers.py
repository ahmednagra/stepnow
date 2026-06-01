# apps/backend/app/Models/customers.py
# A reusable customer (sender / biller) record. Bookings & orders snapshot customer details
# inline; this table backs the repeat-customer search in the parcel console so an order can
# be linked to a known customer (history + outstanding balance) while still snapshotting the
# name/address onto the Order at creation time (so later edits never mutate a placed order).

from uuid import UUID, uuid4
from sqlalchemy import Boolean, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Customer(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_name", "last_name", "first_name"),
        Index("ix_customers_phone", "phone"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    is_business: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_vatid: Mapped[str | None] = mapped_column(String(50), nullable=True)

    street: Mapped[str | None] = mapped_column(String(200), nullable=True)
    plz: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ort: Mapped[str | None] = mapped_column(String(100), nullable=True)

    email: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    orders: Mapped[list["Order"]] = relationship(back_populates="customer")  # noqa: F821
