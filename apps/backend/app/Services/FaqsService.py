# apps/backend/app/Services/FaqsService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.faqs import Faq
from app.Services.AuditService import AuditService

_FIELDS = ("sort_order", "active", "category", "question_de", "question_en", "answer_de", "answer_en")


class FaqsService:

    @staticmethod
    def list_faqs(db: Session, page: int, size: int, q: str | None, category: str | None, include_inactive: bool, include_deleted: bool) -> tuple[list[Faq], int]:
        query = db.query(Faq)
        if not include_deleted:
            query = query.filter(Faq.is_deleted == False)
        if not include_inactive:
            query = query.filter(Faq.active == True)
        if category:
            query = query.filter(Faq.category == category)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(Faq.question_de.ilike(like), Faq.question_en.ilike(like), Faq.answer_de.ilike(like), Faq.answer_en.ilike(like)))
        total = query.with_entities(func.count(Faq.id)).scalar() or 0
        items = query.order_by(Faq.category, Faq.sort_order, Faq.created_at).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_faq(db: Session, faq_id: UUID, allow_deleted: bool = False) -> Faq:
        query = db.query(Faq).filter(Faq.id == faq_id)
        if not allow_deleted:
            query = query.filter(Faq.is_deleted == False)
        f = query.first()
        if not f:
            raise NotFoundError("FAQ not found", faq_id=str(faq_id))
        return f

    @staticmethod
    def create_faq(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Faq:
        f = Faq(**data)
        db.add(f)
        db.flush()
        AuditService.log(db, actor, "faqs", str(f.id), "create", None, FaqsService._snapshot(f), request)
        db.commit()
        db.refresh(f)
        return f

    @staticmethod
    def update_faq(db: Session, faq_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Faq:
        f = FaqsService.get_faq(db, faq_id)
        before = FaqsService._snapshot(f)
        for k, val in data.items():
            setattr(f, k, val)
        db.flush()
        AuditService.log(db, actor, "faqs", str(f.id), "update", before, FaqsService._snapshot(f), request)
        db.commit()
        db.refresh(f)
        return f

    @staticmethod
    def soft_delete_faq(db: Session, faq_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        f = FaqsService.get_faq(db, faq_id)
        before = FaqsService._snapshot(f)
        f.is_deleted = True
        f.deleted_at = datetime.now(timezone.utc)
        f.deleted_by = actor.id
        AuditService.log(db, actor, "faqs", str(f.id), "soft_delete", before, FaqsService._snapshot(f), request)
        db.commit()

    @staticmethod
    def restore_faq(db: Session, faq_id: UUID, actor: AdminUser, request: Request | None = None) -> Faq:
        f = db.query(Faq).filter(Faq.id == faq_id, Faq.is_deleted == True).first()
        if not f:
            raise NotFoundError("Deleted FAQ not found", faq_id=str(faq_id))
        before = FaqsService._snapshot(f)
        f.is_deleted = False
        f.deleted_at = None
        f.deleted_by = None
        AuditService.log(db, actor, "faqs", str(f.id), "restore", before, FaqsService._snapshot(f), request)
        db.commit()
        db.refresh(f)
        return f

    @staticmethod
    def list_public(db: Session, category: str | None) -> list[Faq]:
        query = db.query(Faq).filter(Faq.active == True, Faq.is_deleted == False)
        if category:
            query = query.filter(Faq.category == category)
        return query.order_by(Faq.category, Faq.sort_order, Faq.created_at).all()

    @staticmethod
    def _snapshot(f: Faq) -> dict[str, Any]:
        return {field: getattr(f, field) for field in _FIELDS}
