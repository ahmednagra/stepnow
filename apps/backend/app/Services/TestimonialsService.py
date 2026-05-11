# apps/backend/app/Services/TestimonialsService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.testimonials import Testimonial
from app.Services.AuditService import AuditService

_FIELDS = ("sort_order", "active", "source", "author_name", "author_role_de", "author_role_en", "quote_de", "quote_en", "rating", "date_given")


class TestimonialsService:

    @staticmethod
    def list_testimonials(db: Session, page: int, size: int, q: str | None, source: str | None, include_inactive: bool, include_deleted: bool) -> tuple[list[Testimonial], int]:
        query = db.query(Testimonial)
        if not include_deleted:
            query = query.filter(Testimonial.is_deleted == False)
        if not include_inactive:
            query = query.filter(Testimonial.active == True)
        if source:
            query = query.filter(Testimonial.source == source)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(Testimonial.author_name.ilike(like), Testimonial.quote_de.ilike(like), Testimonial.quote_en.ilike(like)))
        total = query.with_entities(func.count(Testimonial.id)).scalar() or 0
        items = query.order_by(Testimonial.sort_order, Testimonial.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_testimonial(db: Session, testimonial_id: UUID, allow_deleted: bool = False) -> Testimonial:
        query = db.query(Testimonial).filter(Testimonial.id == testimonial_id)
        if not allow_deleted:
            query = query.filter(Testimonial.is_deleted == False)
        t = query.first()
        if not t:
            raise NotFoundError("Testimonial not found", testimonial_id=str(testimonial_id))
        return t

    @staticmethod
    def create_testimonial(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Testimonial:
        t = Testimonial(**data)
        db.add(t)
        db.flush()
        AuditService.log(db, actor, "testimonials", str(t.id), "create", None, TestimonialsService._snapshot(t), request)
        db.commit()
        db.refresh(t)
        return t

    @staticmethod
    def update_testimonial(db: Session, testimonial_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Testimonial:
        t = TestimonialsService.get_testimonial(db, testimonial_id)
        before = TestimonialsService._snapshot(t)
        for k, val in data.items():
            setattr(t, k, val)
        db.flush()
        AuditService.log(db, actor, "testimonials", str(t.id), "update", before, TestimonialsService._snapshot(t), request)
        db.commit()
        db.refresh(t)
        return t

    @staticmethod
    def soft_delete_testimonial(db: Session, testimonial_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        t = TestimonialsService.get_testimonial(db, testimonial_id)
        before = TestimonialsService._snapshot(t)
        t.is_deleted = True
        t.deleted_at = datetime.now(timezone.utc)
        t.deleted_by = actor.id
        AuditService.log(db, actor, "testimonials", str(t.id), "soft_delete", before, TestimonialsService._snapshot(t), request)
        db.commit()

    @staticmethod
    def restore_testimonial(db: Session, testimonial_id: UUID, actor: AdminUser, request: Request | None = None) -> Testimonial:
        t = db.query(Testimonial).filter(Testimonial.id == testimonial_id, Testimonial.is_deleted == True).first()
        if not t:
            raise NotFoundError("Deleted testimonial not found", testimonial_id=str(testimonial_id))
        before = TestimonialsService._snapshot(t)
        t.is_deleted = False
        t.deleted_at = None
        t.deleted_by = None
        AuditService.log(db, actor, "testimonials", str(t.id), "restore", before, TestimonialsService._snapshot(t), request)
        db.commit()
        db.refresh(t)
        return t

    @staticmethod
    def list_public(db: Session) -> list[Testimonial]:
        return db.query(Testimonial).filter(Testimonial.active == True, Testimonial.is_deleted == False).order_by(Testimonial.sort_order, Testimonial.created_at.desc()).all()

    @staticmethod
    def _snapshot(t: Testimonial) -> dict[str, Any]:
        return {f: TestimonialsService._serialize(getattr(t, f)) for f in _FIELDS}

    @staticmethod
    def _serialize(value: Any) -> Any:
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return value
