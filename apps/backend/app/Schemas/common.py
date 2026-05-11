# apps/backend/app/Schemas/common.py
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationInfo(BaseModel):
    page: int = Field(ge=1)
    size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    pages: int = Field(ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    pagination: PaginationInfo


class ApiErrorBody(BaseModel):
    code: str
    message: str
    extra: dict[str, Any] = Field(default_factory=dict)


class ApiError(BaseModel):
    error: ApiErrorBody


class OkResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ok: bool = True
