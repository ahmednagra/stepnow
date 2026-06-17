# apps/backend/app/Http/Controllers/admin/UiStringsController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.ui_strings import UiStringAdminResponse, UiStringCreate, UiStringUpdate
from app.Schemas.common import PaginatedResponse
from app.Services.UiStringsService import UiStringsService


class UiStringsController:

    @staticmethod
    def list_strings(db: Session, page: int, size: int, q: str | None, namespace: str | None, include_deleted: bool) -> PaginatedResponse[UiStringAdminResponse]:
        items, total = UiStringsService.list_strings(db, page, size, q, namespace, include_deleted)
        return PaginatedResponse[UiStringAdminResponse].build(
            [UiStringAdminResponse.model_validate(s) for s in items], page, size, total
        )

    @staticmethod
    def get(db: Session, string_id: UUID) -> UiStringAdminResponse:
        s = UiStringsService.get_string(db, string_id, allow_deleted=True)
        return UiStringAdminResponse.model_validate(s)

    @staticmethod
    def create(db: Session, payload: UiStringCreate, actor: AdminUser, request: Request) -> UiStringAdminResponse:
        s = UiStringsService.create_string(db, payload.model_dump(), actor, request)
        return UiStringAdminResponse.model_validate(s)

    @staticmethod
    def update(db: Session, string_id: UUID, payload: UiStringUpdate, actor: AdminUser, request: Request) -> UiStringAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        s = UiStringsService.update_string(db, string_id, data, actor, request)
        return UiStringAdminResponse.model_validate(s)

    @staticmethod
    def delete(db: Session, string_id: UUID, actor: AdminUser, request: Request) -> None:
        UiStringsService.soft_delete_string(db, string_id, actor, request)

    @staticmethod
    def restore(db: Session, string_id: UUID, actor: AdminUser, request: Request) -> UiStringAdminResponse:
        s = UiStringsService.restore_string(db, string_id, actor, request)
        return UiStringAdminResponse.model_validate(s)
