# apps/backend/app/Models/counters.py
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base


class Counter(Base):
    __tablename__ = "counters"
    scope: Mapped[str] = mapped_column(String(30), primary_key=True, comment="Counter family, e.g. 'order' | 'customer' | 'invoice_revision'")
    key: Mapped[str] = mapped_column(String(60), primary_key=True, comment="Partition within the scope, e.g. a DDMMYY date suffix")
    value: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0, comment="Last issued number for (scope, key)")
