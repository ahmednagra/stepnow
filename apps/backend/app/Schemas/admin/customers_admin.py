# apps/backend/app/Schemas/admin/customers_admin.py
# Request/response schemas for the Customers admin + the repeat-customer search.
# B2B / company-first: company_name is the identity; contact_person is the optional Ansprechpartner.

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    company_name: str = Field(min_length=1, max_length=200)
    contact_person: str | None = Field(default=None, max_length=200)
    is_business: bool = True
    company_vatid: str | None = Field(default=None, max_length=50)
    tax_number: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    internal_notes: str | None = None


class CustomerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    company_name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_person: str | None = Field(default=None, max_length=200)
    is_business: bool | None = None
    company_vatid: str | None = Field(default=None, max_length=50)
    tax_number: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    internal_notes: str | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    company_name: str
    contact_person: str | None
    is_business: bool
    company_vatid: str | None
    tax_number: str | None
    street: str | None
    plz: str | None
    ort: str | None
    email: EmailStr | None
    phone: str | None
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    orders_count: int = 0
    total_billed: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")
    overdue_balance: Decimal = Decimal("0.00")
    last_order_at: datetime | None = None
