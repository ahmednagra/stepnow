# apps/backend/app/Schemas/public.py
# Pydantic response models for all unauthenticated /api/v0/public/* endpoints.

from decimal import Decimal
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.Schemas.admin.courier_admin import ParcelOrderCreate


class ServicePublicListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    slug_de: str
    slug_en: str
    icon: str | None
    title: str
    short_description: str | None
    hero_image_url: str | None


class ServicePublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    slug_de: str
    slug_en: str
    icon: str | None
    title: str
    short_description: str | None
    long_description: str | None
    hero_image_url: str | None
    og_image_url: str | None
    meta_title: str | None
    meta_description: str | None


class LegalPagePublicResponse(BaseModel):
    slug: str
    title: str
    body: str
    published_at: datetime | None
    version_number: int


class SettingsPublicResponse(BaseModel):
    business_name: str
    owner_name: str
    legal_form: str | None
    address_street: str
    address_postcode: str
    address_city: str
    address_country: str | None
    address_lat: Decimal | None = None
    address_lng: Decimal | None = None
    phone: str
    phone_mobile: str | None
    email: str
    whatsapp_url: str | None
    tax_number: str | None
    vat_id: str | None
    default_currency: str
    commercial_register: str | None
    register_court: str | None
    concession_number: str | None
    concession_authority: str | None
    concession_date: date | None
    opening_hours: str | None
    social_facebook: str | None
    social_instagram: str | None
    social_youtube: str | None
    social_tiktok: str | None
    default_meta_title: str | None
    default_og_image_url: str | None
    years_active: int | None = None
    rides_completed: int | None = None
    fleet_size: int | None = None
    google_rating: Decimal | None = None
    google_review_count: int | None = None


class UiStringsPublicResponse(BaseModel):
    locale: str
    strings: dict[str, str]


class VehiclePublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    category: str
    capacity_passengers: int
    capacity_luggage: int
    features: list[str]
    image_url: str | None


class FaqPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    category: str
    question: str
    answer: str


class TestimonialPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    author_name: str
    author_role: str | None
    author_photo_url: str | None
    quote: str
    rating: int | None
    date_given: date | None
    source: str


class PricingItemPublicResponse(BaseModel):
    id: UUID
    from_location: str | None
    to_location: str | None
    price_eur: str
    currency: str
    note: str | None


class PricingCategoryPublicResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    items: list[PricingItemPublicResponse]


class PricingGroupedByServicePublic(BaseModel):
    service_id: UUID
    service_slug: str
    categories: list[PricingCategoryPublicResponse]

# ── Public order creation (no-login worker form, gated by the shared staff code) ──
class PublicFleetVehicle(BaseModel):
    """Vehicle option for the public create-order dropdown (operational, plate-bearing cars)."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    label: str


class StaffGateCheck(BaseModel):
    code: str = Field(min_length=1, max_length=50)


class StaffGateResult(BaseModel):
    ok: bool


class PublicOrderCreate(ParcelOrderCreate):
    """Worker create-order payload: the shared staff code plus an inline customer (no saved-
    customer reference is possible without auth)."""
    staff_access_code: str = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def _public_requires_inline_customer(self):
        if self.customer_id is not None:
            raise ValueError("customer_id is not allowed on public orders")
        if self.customer is None:
            raise ValueError("customer is required")
        return self


class PublicOrderSubmitted(BaseModel):
    id: UUID
    order_number: str
