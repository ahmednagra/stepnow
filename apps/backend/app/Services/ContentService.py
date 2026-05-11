# apps/backend/app/Services/ContentService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.services import Service
from app.Services.AuditService import AuditService

_SERVICE_FIELDS = (
    "sort_order", "active", "icon",
    "slug_de", "slug_en",
    "title_de", "title_en",
    "short_description_de", "short_description_en",
    "long_description_de", "long_description_en",
    "hero_image_url", "og_image_url",
    "meta_title_de", "meta_title_en",
    "meta_description_de", "meta_description_en",
)


class ContentService:

    @staticmethod
    def list_services(db: Session, page: int, size: int, q: str | None, include_inactive: bool, include_deleted: bool) -> tuple[list[Service], int]:
        query = db.query(Service)
        if not include_deleted:
            query = query.filter(Service.is_deleted == False)
        if not include_inactive:
            query = query.filter(Service.active == True)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(Service.title_de.ilike(like), Service.title_en.ilike(like), Service.slug_de.ilike(like), Service.slug_en.ilike(like)))
        total = query.with_entities(func.count(Service.id)).scalar() or 0
        items = query.order_by(Service.sort_order, Service.created_at).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_service(db: Session, service_id: UUID, allow_deleted: bool = False) -> Service:
        query = db.query(Service).filter(Service.id == service_id)
        if not allow_deleted:
            query = query.filter(Service.is_deleted == False)
        svc = query.first()
        if not svc:
            raise NotFoundError("Service not found", service_id=str(service_id))
        return svc

    @staticmethod
    def create_service(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Service:
        ContentService._check_slug_unique(db, data.get("slug_de"), data.get("slug_en"), exclude_id=None)
        svc = Service(**data)
        db.add(svc)
        db.flush()
        AuditService.log(db, actor, "services", str(svc.id), "create", None, ContentService._snapshot(svc), request)
        db.commit()
        db.refresh(svc)
        return svc

    @staticmethod
    def update_service(db: Session, service_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Service:
        svc = ContentService.get_service(db, service_id, allow_deleted=False)
        before = ContentService._snapshot(svc)
        new_slug_de = data.get("slug_de", svc.slug_de)
        new_slug_en = data.get("slug_en", svc.slug_en)
        if new_slug_de != svc.slug_de or new_slug_en != svc.slug_en:
            ContentService._check_slug_unique(db, new_slug_de, new_slug_en, exclude_id=svc.id)
        for k, v in data.items():
            setattr(svc, k, v)
        db.flush()
        after = ContentService._snapshot(svc)
        AuditService.log(db, actor, "services", str(svc.id), "update", before, after, request)
        db.commit()
        db.refresh(svc)
        return svc

    @staticmethod
    def soft_delete_service(db: Session, service_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        svc = ContentService.get_service(db, service_id, allow_deleted=False)
        before = ContentService._snapshot(svc)
        svc.is_deleted = True
        svc.deleted_at = datetime.now(timezone.utc)
        svc.deleted_by = actor.id
        AuditService.log(db, actor, "services", str(svc.id), "soft_delete", before, ContentService._snapshot(svc), request)
        db.commit()

    @staticmethod
    def restore_service(db: Session, service_id: UUID, actor: AdminUser, request: Request | None = None) -> Service:
        svc = db.query(Service).filter(Service.id == service_id, Service.is_deleted == True).first()
        if not svc:
            raise NotFoundError("Deleted service not found", service_id=str(service_id))
        ContentService._check_slug_unique(db, svc.slug_de, svc.slug_en, exclude_id=svc.id)
        before = ContentService._snapshot(svc)
        svc.is_deleted = False
        svc.deleted_at = None
        svc.deleted_by = None
        AuditService.log(db, actor, "services", str(svc.id), "restore", before, ContentService._snapshot(svc), request)
        db.commit()
        db.refresh(svc)
        return svc

    @staticmethod
    def _check_slug_unique(db: Session, slug_de: str | None, slug_en: str | None, exclude_id: UUID | None) -> None:
        if not slug_de and not slug_en:
            return
        clashes = db.query(Service).filter(Service.is_deleted == False)
        if exclude_id is not None:
            clashes = clashes.filter(Service.id != exclude_id)
        clashes = clashes.filter(or_(Service.slug_de == slug_de, Service.slug_en == slug_en, Service.slug_de == slug_en, Service.slug_en == slug_de))
        clash = clashes.first()
        if clash:
            field = "slug_de" if clash.slug_de in (slug_de, slug_en) else "slug_en"
            raise ConflictError(f"Slug already in use by another service", field=field, conflicting_service_id=str(clash.id))

    @staticmethod
    def _snapshot(svc: Service) -> dict[str, Any]:
        return {f: getattr(svc, f) for f in _SERVICE_FIELDS}
