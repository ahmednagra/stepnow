# apps/backend/app/Schemas/admin/audit_log.py
from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    actor_id: UUID | None
    actor_email: str | None
    table_name: str
    record_id: str
    action: str
    changes: dict[str, Any]
    ip_address: str | None
    user_agent: str | None
    notes: str | None
