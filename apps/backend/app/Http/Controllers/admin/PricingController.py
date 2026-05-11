# apps/backend/app/Http/Controllers/admin/PricingController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.pricing import (
    PricingCategoryAdminResponse,
    PricingCategoryCreate,
    PricingCategoryUpdate,
    PricingItemAdminResponse,
    PricingItemCreate,
    PricingItemUpdate,
)
from app.Services.PricingService import PricingService


class PricingController:

    @staticmethod
    def list_categories(db: Session, service_id: UUID, include_deleted: bool) -> list[PricingCategoryAdminResponse]:
        cats = PricingService.list_categories_for_service(db, service_id, include_deleted)
        return [PricingController._serialize_category(c) for c in cats]

    @staticmethod
    def get_category(db: Session, category_id: UUID) -> PricingCategoryAdminResponse:
        c = PricingService.get_category(db, category_id, allow_deleted=True)
        return PricingController._serialize_category(c)

    @staticmethod
    def create_category(db: Session, service_id: UUID, payload: PricingCategoryCreate, actor: AdminUser, request: Request) -> PricingCategoryAdminResponse:
        c = PricingService.create_category(db, service_id, payload.model_dump(), actor, request)
        return PricingController._serialize_category(c)

    @staticmethod
    def update_category(db: Session, category_id: UUID, payload: PricingCategoryUpdate, actor: AdminUser, request: Request) -> PricingCategoryAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        c = PricingService.update_category(db, category_id, data, actor, request)
        return PricingController._serialize_category(c)

    @staticmethod
    def delete_category(db: Session, category_id: UUID, actor: AdminUser, request: Request) -> None:
        PricingService.soft_delete_category(db, category_id, actor, request)

    @staticmethod
    def restore_category(db: Session, category_id: UUID, actor: AdminUser, request: Request) -> PricingCategoryAdminResponse:
        c = PricingService.restore_category(db, category_id, actor, request)
        return PricingController._serialize_category(c)

    @staticmethod
    def list_items(db: Session, category_id: UUID, include_deleted: bool) -> list[PricingItemAdminResponse]:
        items = PricingService.list_items(db, category_id, include_deleted)
        return [PricingItemAdminResponse.model_validate(i) for i in items]

    @staticmethod
    def get_item(db: Session, item_id: UUID) -> PricingItemAdminResponse:
        i = PricingService.get_item(db, item_id, allow_deleted=True)
        return PricingItemAdminResponse.model_validate(i)

    @staticmethod
    def create_item(db: Session, category_id: UUID, payload: PricingItemCreate, actor: AdminUser, request: Request) -> PricingItemAdminResponse:
        i = PricingService.create_item(db, category_id, payload.model_dump(), actor, request)
        return PricingItemAdminResponse.model_validate(i)

    @staticmethod
    def update_item(db: Session, item_id: UUID, payload: PricingItemUpdate, actor: AdminUser, request: Request) -> PricingItemAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        i = PricingService.update_item(db, item_id, data, actor, request)
        return PricingItemAdminResponse.model_validate(i)

    @staticmethod
    def delete_item(db: Session, item_id: UUID, actor: AdminUser, request: Request) -> None:
        PricingService.soft_delete_item(db, item_id, actor, request)

    @staticmethod
    def restore_item(db: Session, item_id: UUID, actor: AdminUser, request: Request) -> PricingItemAdminResponse:
        i = PricingService.restore_item(db, item_id, actor, request)
        return PricingItemAdminResponse.model_validate(i)

    @staticmethod
    def _serialize_category(c) -> PricingCategoryAdminResponse:
        active_items = [i for i in c.items if not i.is_deleted]
        active_items.sort(key=lambda i: (i.sort_order, i.created_at))
        return PricingCategoryAdminResponse(
            id=c.id,
            service_id=c.service_id,
            sort_order=c.sort_order,
            name_de=c.name_de,
            name_en=c.name_en,
            description_de=c.description_de,
            description_en=c.description_en,
            is_deleted=c.is_deleted,
            created_at=c.created_at,
            updated_at=c.updated_at,
            items=[PricingItemAdminResponse.model_validate(i) for i in active_items],
        )
