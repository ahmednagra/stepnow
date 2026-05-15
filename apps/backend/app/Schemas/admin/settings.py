# apps/backend/app/Schemas/admin/settings.py
# Pydantic request/response models for the admin settings editor (GET/PATCH /admin/settings).
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    business_name: str | None = Field(default=None, max_length=200)
    owner_name: str | None = Field(default=None, max_length=200)
    legal_form: str | None = Field(default=None, max_length=100)
    address_street: str | None = Field(default=None, max_length=200)
    address_postcode: str | None = Field(default=None, max_length=10)
    address_city: str | None = Field(default=None, max_length=100)
    address_country: str | None = Field(default=None, max_length=100)
    address_lat: Decimal | None = Field(default=None, ge=-90, le=90)
    address_lng: Decimal | None = Field(default=None, ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=50)
    phone_mobile: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    whatsapp_url: str | None = Field(default=None, max_length=500)
    tax_number: str | None = Field(default=None, max_length=50)
    vat_id: str | None = Field(default=None, max_length=50)
    concession_number: str | None = Field(default=None, max_length=100)
    concession_authority: str | None = Field(default=None, max_length=200)
    concession_date: date | None = None
    opening_hours_de: str | None = None
    opening_hours_en: str | None = None
    social_facebook: str | None = Field(default=None, max_length=500)
    social_instagram: str | None = Field(default=None, max_length=500)
    social_youtube: str | None = Field(default=None, max_length=500)
    social_tiktok: str | None = Field(default=None, max_length=500)
    default_meta_title_de: str | None = Field(default=None, max_length=200)
    default_meta_title_en: str | None = Field(default=None, max_length=200)
    default_og_image_url: str | None = Field(default=None, max_length=500)


class SettingsAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_name: str
    owner_name: str
    legal_form: str
    address_street: str
    address_postcode: str
    address_city: str
    address_country: str
    address_lat: Decimal | None
    address_lng: Decimal | None
    phone: str
    phone_mobile: str | None
    email: str
    whatsapp_url: str | None
    tax_number: str | None
    vat_id: str | None
    concession_number: str | None
    concession_authority: str | None
    concession_date: date | None
    opening_hours_de: str | None
    opening_hours_en: str | None
    social_facebook: str | None
    social_instagram: str | None
    social_youtube: str | None
    social_tiktok: str | None
    default_meta_title_de: str | None
    default_meta_title_en: str | None
    default_og_image_url: str | None
    created_at: datetime
    updated_at: datetime
