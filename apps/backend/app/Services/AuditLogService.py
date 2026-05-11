# apps/backend/app/Services/AuditLogService.py
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.audit import AuditLog


class AuditLogService:

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
    ) -> tuple[list[AuditLog], int]:
        query = db.query(AuditLog)
        if table_name:
            query = query.filter(AuditLog.table_name == table_name)
        if action:
            query = query.filter(AuditLog.action == action)
        if actor_email:
            query = query.filter(AuditLog.actor_email == actor_email)
        if record_id:
            query = query.filter(AuditLog.record_id == record_id)
        if from_date:
            query = query.filter(AuditLog.created_at >= from_date)
        if to_date:
            query = query.filter(AuditLog.created_at <= to_date)
        total = query.with_entities(func.count(AuditLog.id)).scalar() or 0
        items = query.order_by(AuditLog.id.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_entry(db: Session, entry_id: int) -> AuditLog:
        entry = db.query(AuditLog).filter(AuditLog.id == entry_id).first()
        if not entry:
            raise NotFoundError("Audit log entry not found", entry_id=entry_id)
        return entry
