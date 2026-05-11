# apps/backend/app/Schemas/admin/testimonials.py
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TestimonialCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    active: bool = True
    source: str = Field(default="manual", min_length=1, max_length=50)
    # DSGVO: prefer initials or first-name-only here. Architecture §11 (frontend) reminds us to never display full names without explicit consent.
    author_name: str = Field(min_length=1, max_length=200)
    author_role_de: str | None = Field(default=None, max_length=200)
    author_role_en: str | None = Field(default=None, max_length=200)
    author_photo_url: str | None = Field(default=None, max_length=500)
    quote_de: str = Field(min_length=5)
    quote_en: str = Field(min_length=5)
    rating: int | None = Field(default=None, ge=1, le=5)
    date_given: date | None = None


class TestimonialUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    active: bool | None = None
    source: str | None = Field(default=None, min_length=1, max_length=50)
    author_name: str | None = Field(default=None, min_length=1, max_length=200)
    author_role_de: str | None = Field(default=None, max_length=200)
    author_role_en: str | None = Field(default=None, max_length=200)
    author_photo_url: str | None = Field(default=None, max_length=500)
    quote_de: str | None = Field(default=None, min_length=5)
    quote_en: str | None = Field(default=None, min_length=5)
    rating: int | None = Field(default=None, ge=1, le=5)
    date_given: date | None = None


class TestimonialAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sort_order: int
    active: bool
    source: str
    author_name: str
    author_role_de: str | None
    author_role_en: str | None
    author_photo_url: str | None
    quote_de: str
    quote_en: str
    rating: int | None
    date_given: date | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
