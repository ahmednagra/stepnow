# apps/backend/app/Schemas/forms.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BookingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    service_id: UUID | None = None
    pickup_address: str = Field(min_length=3, max_length=500)
    pickup_postcode: str | None = Field(default=None, max_length=10)
    pickup_city: str | None = Field(default=None, max_length=100)
    destination_address: str = Field(min_length=3, max_length=500)
    destination_postcode: str | None = Field(default=None, max_length=10)
    destination_city: str | None = Field(default=None, max_length=100)
    requested_datetime: datetime
    passenger_count: int = Field(ge=1, le=20, default=1)
    luggage_count: int = Field(ge=0, le=20, default=0)
    special_requirements: str | None = Field(default=None, max_length=2000)
    customer_name: str = Field(min_length=2, max_length=200)
    customer_phone: str = Field(min_length=4, max_length=50)
    customer_email: EmailStr
    is_business: bool = False
    company_name: str | None = Field(default=None, max_length=200)
    company_vatid: str | None = Field(default=None, max_length=50)
    language: str = Field(default="de", pattern=r"^(de|en)$")
    consent_dsgvo: bool = Field(description="User confirms DSGVO consent")
    website: str | None = Field(default=None, max_length=500, description="Honeypot - leave empty")


class BookingSubmitted(BaseModel):
    reference: str
    submitted_at: datetime


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    subject_category: str = Field(default="general", pattern=r"^(general|complaint|press|business|other)$")
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    message: str = Field(min_length=10, max_length=10000)
    language: str = Field(default="de", pattern=r"^(de|en)$")
    consent_dsgvo: bool = Field(description="User confirms DSGVO consent")
    website: str | None = Field(default=None, max_length=500, description="Honeypot - leave empty")


class ContactSubmitted(BaseModel):
    submitted_at: datetime
