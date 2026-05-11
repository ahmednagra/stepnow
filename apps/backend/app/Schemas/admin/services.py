# apps/backend/app/Schemas/admin/services.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    active: bool = True
    icon: str | None = Field(default=None, max_length=50)
    slug_de: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")
    slug_en: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")
    title_de: str = Field(min_length=1, max_length=200)
    title_en: str = Field(min_length=1, max_length=200)
    short_description_de: str | None = Field(default=None, max_length=500)
    short_description_en: str | None = Field(default=None, max_length=500)
    long_description_de: str | None = None
    long_description_en: str | None = None
    hero_image_url: str | None = Field(default=None, max_length=500)
    og_image_url: str | None = Field(default=None, max_length=500)
    meta_title_de: str | None = Field(default=None, max_length=200)
    meta_title_en: str | None = Field(default=None, max_length=200)
    meta_description_de: str | None = Field(default=None, max_length=300)
    meta_description_en: str | None = Field(default=None, max_length=300)


class ServiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    active: bool | None = None
    icon: str | None = Field(default=None, max_length=50)
    slug_de: str | None = Field(default=None, min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")
    slug_en: str | None = Field(default=None, min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")
    title_de: str | None = Field(default=None, min_length=1, max_length=200)
    title_en: str | None = Field(default=None, min_length=1, max_length=200)
    short_description_de: str | None = Field(default=None, max_length=500)
    short_description_en: str | None = Field(default=None, max_length=500)
    long_description_de: str | None = None
    long_description_en: str | None = None
    hero_image_url: str | None = Field(default=None, max_length=500)
    og_image_url: str | None = Field(default=None, max_length=500)
    meta_title_de: str | None = Field(default=None, max_length=200)
    meta_title_en: str | None = Field(default=None, max_length=200)
    meta_description_de: str | None = Field(default=None, max_length=300)
    meta_description_en: str | None = Field(default=None, max_length=300)


class ServiceAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sort_order: int
    active: bool
    icon: str | None
    slug_de: str
    slug_en: str
    title_de: str
    title_en: str
    short_description_de: str | None
    short_description_en: str | None
    long_description_de: str | None
    long_description_en: str | None
    hero_image_url: str | None
    og_image_url: str | None
    meta_title_de: str | None
    meta_title_en: str | None
    meta_description_de: str | None
    meta_description_en: str | None
    is_deleted: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime
