# apps/backend/app/Schemas/public.py
# Pydantic response models for all unauthenticated /api/v0/public/* endpoints.

from decimal import Decimal
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


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
    address_street: str
    address_postcode: str
    address_city: str
    address_lat: Decimal | None = None
    address_lng: Decimal | None = None
    phone: str
    phone_mobile: str | None
    email: str
    whatsapp_url: str | None
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