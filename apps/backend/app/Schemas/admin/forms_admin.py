# apps/backend/app/Schemas/admin/forms_admin.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Booking statuses follow the architecture's lifecycle.
_BOOKING_STATUSES = ("new", "contacted", "quoted", "confirmed", "completed", "cancelled")


class BookingStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    status: str = Field(pattern=r"^(new|contacted|quoted|confirmed|completed|cancelled)$")
    quoted_price_eur: str | None = Field(default=None, max_length=50)
    internal_notes: str | None = None


class BookingAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    reference: str
    status: str
    service_id: UUID | None
    pickup_address: str
    pickup_postcode: str | None
    pickup_city: str | None
    destination_address: str
    destination_postcode: str | None
    destination_city: str | None
    requested_datetime: datetime
    passenger_count: int
    luggage_count: int
    special_requirements: str | None
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    is_business: bool
    company_name: str | None
    company_vatid: str | None
    language: str
    ip_address: str | None
    user_agent: str | None
    quoted_price_eur: str | None
    quoted_at: datetime | None
    completed_at: datetime | None
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class ContactMessageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    is_handled: bool | None = None
    internal_notes: str | None = None


class ContactMessageAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    subject_category: str
    name: str
    email: EmailStr
    phone: str | None
    message: str
    language: str
    is_handled: bool
    handled_at: datetime | None
    ip_address: str | None
    user_agent: str | None
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
