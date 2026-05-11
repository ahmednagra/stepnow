# apps/backend/app/Schemas/auth.py

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field

_strict = ConfigDict(extra="forbid")


class LoginRequest(BaseModel):
    model_config = _strict
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class RefreshRequest(BaseModel):
    model_config = _strict
    refresh_token: str = Field(min_length=10, max_length=500)


class LogoutRequest(BaseModel):
    model_config = _strict
    refresh_token: str = Field(min_length=10, max_length=500)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AdminProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    full_name: str
    active: bool
    last_login_at: datetime | None
    created_at: datetime