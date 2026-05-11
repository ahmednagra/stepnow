# apps/backend/app/Services/AuditService.py
from typing import Any
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Models.audit import AuditLog


class AuditService:

    @staticmethod
    def log(
        db: Session,
        actor: AdminUser | None,
        table_name: str,
        record_id: str,
        action: str,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
        request: Request | None = None,
        notes: str | None = None,
    ) -> None:
        changes = AuditService._diff(before, after)
        entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            table_name=table_name,
            record_id=str(record_id),
            action=action,
            changes=changes,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
            notes=notes,
        )
        db.add(entry)

    @staticmethod
    def _diff(before: dict[str, Any] | None, after: dict[str, Any] | None) -> dict[str, Any]:
        if before is None and after is None:
            return {}
        if before is None:
            return {k: {"old": None, "new": v} for k, v in (after or {}).items()}
        if after is None:
            return {k: {"old": v, "new": None} for k, v in (before or {}).items()}
        diff: dict[str, Any] = {}
        for k in set(before.keys()) | set(after.keys()):
            if before.get(k) != after.get(k):
                diff[k] = {"old": before.get(k), "new": after.get(k)}
        return diff
