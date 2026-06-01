# apps/backend/app/Schemas/admin/drivers_admin.py
# Request/response schemas for the Drivers admin. Mirrors the style of
# app/Schemas/admin/orders_admin.py (extra="forbid" inputs, from_attributes responses).

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DriverCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    full_name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    vehicle_id: UUID | None = None
    vehicle_label: str | None = Field(default=None, max_length=200)
    active: bool = True
    internal_notes: str | None = None


class DriverUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    vehicle_id: UUID | None = None
    vehicle_label: str | None = Field(default=None, max_length=200)
    active: bool | None = None
    internal_notes: str | None = None


class DriverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    full_name: str
    phone: str | None
    email: EmailStr | None
    vehicle_id: UUID | None
    vehicle_label: str | None
    active: bool
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
