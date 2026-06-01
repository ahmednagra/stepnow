# apps/backend/app/Schemas/admin/customers_admin.py
# Request/response schemas for the Customers admin + the repeat-customer search.

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    is_business: bool = False
    company_name: str | None = Field(default=None, max_length=200)
    company_vatid: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    internal_notes: str | None = None


class CustomerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    is_business: bool | None = None
    company_name: str | None = Field(default=None, max_length=200)
    company_vatid: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    internal_notes: str | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    first_name: str
    last_name: str
    is_business: bool
    company_name: str | None
    company_vatid: str | None
    street: str | None
    plz: str | None
    ort: str | None
    email: EmailStr | None
    phone: str | None
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
