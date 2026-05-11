# apps/backend/app/Schemas/admin/legal_pages.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class LegalPageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    slug: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")


class LegalPageDraftSave(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title_de: str = Field(min_length=1, max_length=200)
    title_en: str = Field(min_length=1, max_length=200)
    body_de: str = Field(min_length=1)
    body_en: str = Field(min_length=1)
    changes_summary: str | None = Field(default=None, max_length=2000)


class LegalPagePublish(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    changes_summary: str | None = Field(default=None, max_length=2000)


class LegalPageRollback(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_version_id: UUID
    changes_summary: str | None = Field(default=None, max_length=2000)


class LegalPageVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    version_number: int
    title_de: str
    title_en: str
    body_de: str
    body_en: str
    is_published: bool
    published_at: datetime | None
    changes_summary: str | None
    created_by: UUID
    created_at: datetime


class LegalPageAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    published_version_id: UUID | None
    draft_version_id: UUID | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    published_version: LegalPageVersionResponse | None = None
    draft_version: LegalPageVersionResponse | None = None


class LegalPagePreview(BaseModel):
    title_de: str
    title_en: str
    body_de: str
    body_en: str
    placeholders_used: list[str]
    placeholders_unresolved: list[str]
