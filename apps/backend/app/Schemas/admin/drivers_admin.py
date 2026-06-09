# apps/backend/app/Schemas/admin/drivers_admin.py

# Adds the driving-licence + P-Schein compliance fields and the §21 StVG check record.

from datetime import date, datetime
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
    license_number: str | None = Field(default=None, max_length=50)
    license_classes: list[str] | None = None
    license_expiry: date | None = None
    license_restrictions: str | None = Field(default=None, max_length=300)
    pschein_number: str | None = Field(default=None, max_length=50)
    pschein_expiry: date | None = None


class DriverUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    vehicle_id: UUID | None = None
    vehicle_label: str | None = Field(default=None, max_length=200)
    active: bool | None = None
    internal_notes: str | None = None
    license_number: str | None = Field(default=None, max_length=50)
    license_classes: list[str] | None = None
    license_expiry: date | None = None
    license_restrictions: str | None = Field(default=None, max_length=300)
    pschein_number: str | None = Field(default=None, max_length=50)
    pschein_expiry: date | None = None


class LicenseCheckCreate(BaseModel):
    """Record a §21 StVG licence inspection. Defaults to today; interval defaults to 6 months."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    checked_on: date | None = None  # defaults to today
    interval_months: int = Field(default=6, ge=1, le=24)
    notes: str | None = Field(default=None, max_length=500)

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
    license_number: str | None
    license_classes: list[str] | None
    license_expiry: date | None
    license_restrictions: str | None
    pschein_number: str | None
    pschein_expiry: date | None
    last_license_check_at: date | None
    next_license_check_due: date | None
    last_checked_by: UUID | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    compliance_status: str = "unknown"   # ok | due | expired | blocked | unknown
    orders_count: int = 0
    last_dispatch_at: datetime | None = None
