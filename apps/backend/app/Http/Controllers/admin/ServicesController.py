# apps/backend/app/Http/Controllers/admin/ServicesController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.services import ServiceAdminResponse, ServiceCreate, ServiceUpdate
from app.Schemas.common import PaginatedResponse
from app.Services.ContentService import ContentService


class ServicesController:

    @staticmethod
    def list(db: Session, page: int, size: int, q: str | None, include_inactive: bool, include_deleted: bool) -> PaginatedResponse[ServiceAdminResponse]:
        items, total = ContentService.list_services(db, page, size, q, include_inactive, include_deleted)
        return PaginatedResponse[ServiceAdminResponse].build(
            [ServiceAdminResponse.model_validate(s) for s in items], page, size, total
        )

    @staticmethod
    def get(db: Session, service_id: UUID) -> ServiceAdminResponse:
        svc = ContentService.get_service(db, service_id, allow_deleted=True)
        return ServiceAdminResponse.model_validate(svc)

    @staticmethod
    def create(db: Session, payload: ServiceCreate, actor: AdminUser, request: Request) -> ServiceAdminResponse:
        svc = ContentService.create_service(db, payload.model_dump(), actor, request)
        return ServiceAdminResponse.model_validate(svc)

    @staticmethod
    def update(db: Session, service_id: UUID, payload: ServiceUpdate, actor: AdminUser, request: Request) -> ServiceAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        svc = ContentService.update_service(db, service_id, data, actor, request)
        return ServiceAdminResponse.model_validate(svc)

    @staticmethod
    def delete(db: Session, service_id: UUID, actor: AdminUser, request: Request) -> None:
        ContentService.soft_delete_service(db, service_id, actor, request)

    @staticmethod
    def restore(db: Session, service_id: UUID, actor: AdminUser, request: Request) -> ServiceAdminResponse:
        svc = ContentService.restore_service(db, service_id, actor, request)
        return ServiceAdminResponse.model_validate(svc)
