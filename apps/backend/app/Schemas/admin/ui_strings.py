# apps/backend/app/Schemas/admin/ui_strings.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


_KEY_PATTERN = r"^[a-z0-9][a-z0-9_.]*[a-z0-9]$"
_NAMESPACE_PATTERN = r"^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$"


class UiStringCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    key: str = Field(min_length=2, max_length=200, pattern=_KEY_PATTERN)
    namespace: str = Field(min_length=1, max_length=100, pattern=_NAMESPACE_PATTERN)
    value_de: str = Field(min_length=1, max_length=10000)
    value_en: str = Field(min_length=1, max_length=10000)
    description: str | None = Field(default=None, max_length=500)
    is_locked: bool = False


class UiStringUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    namespace: str | None = Field(default=None, min_length=1, max_length=100, pattern=_NAMESPACE_PATTERN)
    value_de: str | None = Field(default=None, min_length=1, max_length=10000)
    value_en: str | None = Field(default=None, min_length=1, max_length=10000)
    description: str | None = Field(default=None, max_length=500)
    is_locked: bool | None = None


class UiStringAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    key: str
    namespace: str
    value_de: str
    value_en: str
    description: str | None
    is_locked: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
