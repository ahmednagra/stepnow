# apps/backend/routes/api/v0/admin/audit_log.py
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.AuditLogController import AuditLogController
from app.Models.admin import AdminUser
from app.Schemas.admin.audit_log import AuditLogEntry
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/audit-log", tags=["admin: audit log"])


@router.get("", response_model=PaginatedResponse[AuditLogEntry])
async def list_entries(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    table_name: str | None = Query(None, max_length=100),
    action: str | None = Query(None, max_length=20),
    actor_email: str | None = Query(None, max_length=200),
    record_id: str | None = Query(None, max_length=100),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
) -> PaginatedResponse[AuditLogEntry]:
    return AuditLogController.list_entries(db, page, size, table_name, action, actor_email, record_id, from_date, to_date)


@router.get("/{entry_id}", response_model=AuditLogEntry)
async def get_entry(entry_id: int, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> AuditLogEntry:
    return AuditLogController.get_entry(db, entry_id)
