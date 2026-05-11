# apps/backend/app/Schemas/admin/pricing.py
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class PricingCategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    name_de: str = Field(min_length=1, max_length=200)
    name_en: str = Field(min_length=1, max_length=200)
    description_de: str | None = Field(default=None, max_length=500)
    description_en: str | None = Field(default=None, max_length=500)


class PricingCategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    name_de: str | None = Field(default=None, min_length=1, max_length=200)
    name_en: str | None = Field(default=None, min_length=1, max_length=200)
    description_de: str | None = Field(default=None, max_length=500)
    description_en: str | None = Field(default=None, max_length=500)


class PricingItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    from_location_de: str | None = Field(default=None, max_length=200)
    from_location_en: str | None = Field(default=None, max_length=200)
    to_location_de: str | None = Field(default=None, max_length=200)
    to_location_en: str | None = Field(default=None, max_length=200)
    price_eur: Decimal = Field(ge=0, le=99999999, decimal_places=2)
    note_de: str | None = Field(default=None, max_length=500)
    note_en: str | None = Field(default=None, max_length=500)


class PricingItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    from_location_de: str | None = Field(default=None, max_length=200)
    from_location_en: str | None = Field(default=None, max_length=200)
    to_location_de: str | None = Field(default=None, max_length=200)
    to_location_en: str | None = Field(default=None, max_length=200)
    price_eur: Decimal | None = Field(default=None, ge=0, le=99999999, decimal_places=2)
    note_de: str | None = Field(default=None, max_length=500)
    note_en: str | None = Field(default=None, max_length=500)


class PricingItemAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    category_id: UUID
    sort_order: int
    from_location_de: str | None
    from_location_en: str | None
    to_location_de: str | None
    to_location_en: str | None
    price_eur: Decimal
    note_de: str | None
    note_en: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class PricingCategoryAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    service_id: UUID
    sort_order: int
    name_de: str
    name_en: str
    description_de: str | None
    description_en: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    items: list[PricingItemAdminResponse] = Field(default_factory=list)
