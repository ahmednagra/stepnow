# apps/backend/app/Schemas/common.py
import math
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

    @classmethod
    def build(cls, items: list[T], page: int, size: int, total: int) -> "PaginatedResponse[T]":
        pages = max(1, math.ceil(total / size)) if total else 0
        return cls(items=items, pagination=PaginationInfo(page=page, size=size, total=total, pages=pages))


class ApiErrorBody(BaseModel):
    code: str
    message: str
    extra: dict[str, Any] = Field(default_factory=dict)


class ApiError(BaseModel):
    error: ApiErrorBody


class OkResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ok: bool = True
