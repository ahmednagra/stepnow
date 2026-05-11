# apps/backend/app/Services/UiStringsService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, ForbiddenError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.ui_strings import UiString
from app.Services.AuditService import AuditService

_UI_STRING_FIELDS = ("key", "namespace", "value_de", "value_en", "description", "is_locked")


class UiStringsService:

    @staticmethod
    def list_strings(db: Session, page: int, size: int, q: str | None, namespace: str | None, include_deleted: bool) -> tuple[list[UiString], int]:
        query = db.query(UiString)
        if not include_deleted:
            query = query.filter(UiString.is_deleted == False)
        if namespace:
            query = query.filter(UiString.namespace == namespace)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(UiString.key.ilike(like), UiString.value_de.ilike(like), UiString.value_en.ilike(like), UiString.description.ilike(like)))
        total = query.with_entities(func.count(UiString.id)).scalar() or 0
        items = query.order_by(UiString.namespace, UiString.key).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_string(db: Session, string_id: UUID, allow_deleted: bool = False) -> UiString:
        query = db.query(UiString).filter(UiString.id == string_id)
        if not allow_deleted:
            query = query.filter(UiString.is_deleted == False)
        s = query.first()
        if not s:
            raise NotFoundError("UI string not found", string_id=str(string_id))
        return s

    @staticmethod
    def create_string(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> UiString:
        existing = db.query(UiString).filter(UiString.key == data["key"]).first()
        if existing:
            raise ConflictError("UI string key already exists", key=data["key"])
        s = UiString(**data)
        db.add(s)
        db.flush()
        AuditService.log(db, actor, "ui_strings", str(s.id), "create", None, UiStringsService._snapshot(s), request)
        db.commit()
        db.refresh(s)
        return s

    @staticmethod
    def update_string(db: Session, string_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> UiString:
        s = UiStringsService.get_string(db, string_id)
        if s.is_locked and "is_locked" not in data:
            # is_locked protects against accidental changes, but admin can still toggle the flag.
            raise ForbiddenError("UI string is locked. Unlock it first via PATCH is_locked=false.", string_id=str(string_id), key=s.key)
        before = UiStringsService._snapshot(s)
        for k, v in data.items():
            setattr(s, k, v)
        db.flush()
        after = UiStringsService._snapshot(s)
        AuditService.log(db, actor, "ui_strings", str(s.id), "update", before, after, request)
        db.commit()
        db.refresh(s)
        return s

    @staticmethod
    def soft_delete_string(db: Session, string_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        s = UiStringsService.get_string(db, string_id)
        if s.is_locked:
            raise ForbiddenError("Cannot delete a locked UI string. Unlock it first.", string_id=str(string_id), key=s.key)
        before = UiStringsService._snapshot(s)
        s.is_deleted = True
        s.deleted_at = datetime.now(timezone.utc)
        s.deleted_by = actor.id
        AuditService.log(db, actor, "ui_strings", str(s.id), "soft_delete", before, UiStringsService._snapshot(s), request)
        db.commit()

    @staticmethod
    def restore_string(db: Session, string_id: UUID, actor: AdminUser, request: Request | None = None) -> UiString:
        s = db.query(UiString).filter(UiString.id == string_id, UiString.is_deleted == True).first()
        if not s:
            raise NotFoundError("Deleted UI string not found", string_id=str(string_id))
        before = UiStringsService._snapshot(s)
        s.is_deleted = False
        s.deleted_at = None
        s.deleted_by = None
        AuditService.log(db, actor, "ui_strings", str(s.id), "restore", before, UiStringsService._snapshot(s), request)
        db.commit()
        db.refresh(s)
        return s

    @staticmethod
    def bulk_public(db: Session, locale: str, namespace: str | None = None) -> dict[str, str]:
        query = db.query(UiString).filter(UiString.is_deleted == False)
        if namespace:
            query = query.filter(UiString.namespace == namespace)
        column = UiString.value_de if locale == "de" else UiString.value_en
        rows = query.with_entities(UiString.key, column).all()
        return {key: value for key, value in rows}

    @staticmethod
    def _snapshot(s: UiString) -> dict[str, Any]:
        return {f: getattr(s, f) for f in _UI_STRING_FIELDS}
