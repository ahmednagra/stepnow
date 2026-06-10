# apps/backend/app/Schemas/notifications/notification.py
# Request/response shapes for the admin notification panel. Style mirrors
# app/Schemas/admin/orders_admin.py: extra="forbid" on inputs, from_attributes on responses.

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    recipient_id: UUID
    type: str
    category: str
    title: str
    body: str | None
    link: str | None
    is_read: bool
    read_at: datetime | None
    is_archived: bool
    notification_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class UnreadCountResponse(BaseModel):
    unread: int


class MarkReadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ids: list[UUID] = Field(min_length=1, max_length=200)
