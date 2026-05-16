# apps/backend/app/Services/PricingService.py
# Pricing service. Adds list_public_all_grouped() to return pricing for every active service in one eager-loaded query (kills N+1 from public pricing/services pages).

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session, selectinload
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.pricing import PricingCategory, PricingItem
from app.Models.services import Service
from app.Services.AuditService import AuditService

_CAT_FIELDS = ("service_id", "sort_order", "name_de", "name_en", "description_de", "description_en")
_ITEM_FIELDS = ("category_id", "sort_order", "from_location_de", "from_location_en", "to_location_de", "to_location_en", "price_eur", "note_de", "note_en")


class PricingService:

    @staticmethod
    def list_categories_for_service(db: Session, service_id: UUID, include_deleted: bool = False) -> list[PricingCategory]:
        svc = db.query(Service).filter(Service.id == service_id, Service.is_deleted == False).first()
        if not svc:
            raise NotFoundError("Service not found", service_id=str(service_id))
        query = db.query(PricingCategory).filter(PricingCategory.service_id == service_id).options(selectinload(PricingCategory.items))
        if not include_deleted:
            query = query.filter(PricingCategory.is_deleted == False)
        return query.order_by(PricingCategory.sort_order, PricingCategory.created_at).all()

    @staticmethod
    def get_category(db: Session, category_id: UUID, allow_deleted: bool = False) -> PricingCategory:
        query = db.query(PricingCategory).filter(PricingCategory.id == category_id).options(selectinload(PricingCategory.items))
        if not allow_deleted:
            query = query.filter(PricingCategory.is_deleted == False)
        c = query.first()
        if not c:
            raise NotFoundError("Pricing category not found", category_id=str(category_id))
        return c

    @staticmethod
    def create_category(db: Session, service_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> PricingCategory:
        svc = db.query(Service).filter(Service.id == service_id, Service.is_deleted == False).first()
        if not svc:
            raise NotFoundError("Service not found", service_id=str(service_id))
        c = PricingCategory(service_id=service_id, **data)
        db.add(c)
        db.flush()
        AuditService.log(db, actor, "pricing_categories", str(c.id), "create", None, PricingService._snapshot_category(c), request)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def update_category(db: Session, category_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> PricingCategory:
        c = PricingService.get_category(db, category_id)
        before = PricingService._snapshot_category(c)
        for k, v in data.items():
            setattr(c, k, v)
        db.flush()
        AuditService.log(db, actor, "pricing_categories", str(c.id), "update", before, PricingService._snapshot_category(c), request)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def soft_delete_category(db: Session, category_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        c = PricingService.get_category(db, category_id)
        before = PricingService._snapshot_category(c)
        c.is_deleted = True
        c.deleted_at = datetime.now(timezone.utc)
        c.deleted_by = actor.id
        AuditService.log(db, actor, "pricing_categories", str(c.id), "soft_delete", before, PricingService._snapshot_category(c), request)
        db.commit()

    @staticmethod
    def restore_category(db: Session, category_id: UUID, actor: AdminUser, request: Request | None = None) -> PricingCategory:
        c = db.query(PricingCategory).filter(PricingCategory.id == category_id, PricingCategory.is_deleted == True).first()
        if not c:
            raise NotFoundError("Deleted pricing category not found", category_id=str(category_id))
        before = PricingService._snapshot_category(c)
        c.is_deleted = False
        c.deleted_at = None
        c.deleted_by = None
        AuditService.log(db, actor, "pricing_categories", str(c.id), "restore", before, PricingService._snapshot_category(c), request)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def list_items(db: Session, category_id: UUID, include_deleted: bool = False) -> list[PricingItem]:
        PricingService.get_category(db, category_id, allow_deleted=True)
        query = db.query(PricingItem).filter(PricingItem.category_id == category_id)
        if not include_deleted:
            query = query.filter(PricingItem.is_deleted == False)
        return query.order_by(PricingItem.sort_order, PricingItem.created_at).all()

    @staticmethod
    def get_item(db: Session, item_id: UUID, allow_deleted: bool = False) -> PricingItem:
        query = db.query(PricingItem).filter(PricingItem.id == item_id)
        if not allow_deleted:
            query = query.filter(PricingItem.is_deleted == False)
        i = query.first()
        if not i:
            raise NotFoundError("Pricing item not found", item_id=str(item_id))
        return i

    @staticmethod
    def create_item(db: Session, category_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> PricingItem:
        cat = db.query(PricingCategory).filter(PricingCategory.id == category_id, PricingCategory.is_deleted == False).first()
        if not cat:
            raise NotFoundError("Pricing category not found or deleted", category_id=str(category_id))
        i = PricingItem(category_id=category_id, **data)
        db.add(i)
        db.flush()
        AuditService.log(db, actor, "pricing_items", str(i.id), "create", None, PricingService._snapshot_item(i), request)
        db.commit()
        db.refresh(i)
        return i

    @staticmethod
    def update_item(db: Session, item_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> PricingItem:
        i = PricingService.get_item(db, item_id)
        before = PricingService._snapshot_item(i)
        for k, v in data.items():
            setattr(i, k, v)
        db.flush()
        AuditService.log(db, actor, "pricing_items", str(i.id), "update", before, PricingService._snapshot_item(i), request)
        db.commit()
        db.refresh(i)
        return i

    @staticmethod
    def soft_delete_item(db: Session, item_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        i = PricingService.get_item(db, item_id)
        before = PricingService._snapshot_item(i)
        i.is_deleted = True
        i.deleted_at = datetime.now(timezone.utc)
        i.deleted_by = actor.id
        AuditService.log(db, actor, "pricing_items", str(i.id), "soft_delete", before, PricingService._snapshot_item(i), request)
        db.commit()

    @staticmethod
    def restore_item(db: Session, item_id: UUID, actor: AdminUser, request: Request | None = None) -> PricingItem:
        i = db.query(PricingItem).filter(PricingItem.id == item_id, PricingItem.is_deleted == True).first()
        if not i:
            raise NotFoundError("Deleted pricing item not found", item_id=str(item_id))
        before = PricingService._snapshot_item(i)
        i.is_deleted = False
        i.deleted_at = None
        i.deleted_by = None
        AuditService.log(db, actor, "pricing_items", str(i.id), "restore", before, PricingService._snapshot_item(i), request)
        db.commit()
        db.refresh(i)
        return i

    @staticmethod
    def list_public_for_service_slug(db: Session, slug: str, locale: str) -> list[dict[str, Any]]:
        slug_column = Service.slug_de if locale == "de" else Service.slug_en
        svc = db.query(Service).filter(slug_column == slug, Service.active == True, Service.is_deleted == False).first()
        if not svc:
            raise NotFoundError("Service not found", slug=slug, locale=locale)
        cats = db.query(PricingCategory).filter(PricingCategory.service_id == svc.id, PricingCategory.is_deleted == False).options(selectinload(PricingCategory.items)).order_by(PricingCategory.sort_order, PricingCategory.created_at).all()
        is_de = locale == "de"
        result = []
        for c in cats:
            items = [i for i in c.items if not i.is_deleted]
            items.sort(key=lambda i: (i.sort_order, i.created_at))
            result.append({
                "id": c.id,
                "name": c.name_de if is_de else c.name_en,
                "description": c.description_de if is_de else c.description_en,
                "items": [{
                    "id": i.id,
                    "from_location": i.from_location_de if is_de else i.from_location_en,
                    "to_location": i.to_location_de if is_de else i.to_location_en,
                    "price_eur": str(i.price_eur),
                    "note": i.note_de if is_de else i.note_en,
                } for i in items],
            })
        return result

    @staticmethod
    def list_public_all_grouped(db: Session, locale: str) -> list[dict[str, Any]]:
        is_de = locale == "de"
        services = db.query(Service).filter(Service.active == True, Service.is_deleted == False).order_by(Service.sort_order, Service.created_at).all()
        if not services:
            return []
        service_ids = [s.id for s in services]
        cats = db.query(PricingCategory).filter(PricingCategory.service_id.in_(service_ids), PricingCategory.is_deleted == False).options(selectinload(PricingCategory.items)).order_by(PricingCategory.sort_order, PricingCategory.created_at).all()
        cats_by_service: dict[UUID, list[PricingCategory]] = {sid: [] for sid in service_ids}
        for c in cats:
            cats_by_service[c.service_id].append(c)
        result = []
        for svc in services:
            svc_cats = cats_by_service.get(svc.id, [])
            categories_payload = []
            for c in svc_cats:
                items = [i for i in c.items if not i.is_deleted]
                items.sort(key=lambda i: (i.sort_order, i.created_at))
                categories_payload.append({
                    "id": c.id,
                    "name": c.name_de if is_de else c.name_en,
                    "description": c.description_de if is_de else c.description_en,
                    "items": [{
                        "id": i.id,
                        "from_location": i.from_location_de if is_de else i.from_location_en,
                        "to_location": i.to_location_de if is_de else i.to_location_en,
                        "price_eur": str(i.price_eur),
                        "note": i.note_de if is_de else i.note_en,
                    } for i in items],
                })
            result.append({
                "service_id": svc.id,
                "service_slug": svc.slug_de if is_de else svc.slug_en,
                "categories": categories_payload,
            })
        return result

    @staticmethod
    def _snapshot_category(c: PricingCategory) -> dict[str, Any]:
        return {f: PricingService._serialize(getattr(c, f)) for f in _CAT_FIELDS}

    @staticmethod
    def _snapshot_item(i: PricingItem) -> dict[str, Any]:
        return {f: PricingService._serialize(getattr(i, f)) for f in _ITEM_FIELDS}

    @staticmethod
    def _serialize(value: Any) -> Any:
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, Decimal):
            return str(value)
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return value
