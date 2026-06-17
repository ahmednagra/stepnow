# apps/backend/app/Http/Controllers/admin/AuditLogController.py
from datetime import datetime
from sqlalchemy.orm import Session
from app.Schemas.admin.audit_log import AuditLogEntry
from app.Schemas.common import PaginatedResponse
from app.Services.AuditLogService import AuditLogService


class AuditLogController:

    @staticmethod
    def list_entries(
        db: Session,
        page: int,
        size: int,
        table_name: str | None,
        action: str | None,
        actor_email: str | None,
        record_id: str | None,
        from_date: datetime | None,
        to_date: datetime | None,
    ) -> PaginatedResponse[AuditLogEntry]:
        items, total = AuditLogService.list_entries(db, page, size, table_name, action, actor_email, record_id, from_date, to_date)
        return PaginatedResponse[AuditLogEntry].build(
            [AuditLogEntry.model_validate(e) for e in items], page, size, total
        )

    @staticmethod
    def get_entry(db: Session, entry_id: int) -> AuditLogEntry:
        entry = AuditLogService.get_entry(db, entry_id)
        return AuditLogEntry.model_validate(entry)
