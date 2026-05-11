# apps/backend/app/Schemas/admin/faqs.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FaqCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    active: bool = True
    category: str = Field(default="general", min_length=1, max_length=50)
    question_de: str = Field(min_length=3, max_length=500)
    question_en: str = Field(min_length=3, max_length=500)
    answer_de: str = Field(min_length=3)
    answer_en: str = Field(min_length=3)


class FaqUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    active: bool | None = None
    category: str | None = Field(default=None, min_length=1, max_length=50)
    question_de: str | None = Field(default=None, min_length=3, max_length=500)
    question_en: str | None = Field(default=None, min_length=3, max_length=500)
    answer_de: str | None = Field(default=None, min_length=3)
    answer_en: str | None = Field(default=None, min_length=3)


class FaqAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sort_order: int
    active: bool
    category: str
    question_de: str
    question_en: str
    answer_de: str
    answer_en: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
