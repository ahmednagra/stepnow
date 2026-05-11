# apps/backend/app/Http/Controllers/admin/FaqsController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.faqs import FaqAdminResponse, FaqCreate, FaqUpdate
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Services.FaqsService import FaqsService


class FaqsController:

    @staticmethod
    def list_faqs(db: Session, page: int, size: int, q: str | None, category: str | None, include_inactive: bool, include_deleted: bool) -> PaginatedResponse[FaqAdminResponse]:
        items, total = FaqsService.list_faqs(db, page, size, q, category, include_inactive, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[FaqAdminResponse](
            items=[FaqAdminResponse.model_validate(f) for f in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, faq_id: UUID) -> FaqAdminResponse:
        f = FaqsService.get_faq(db, faq_id, allow_deleted=True)
        return FaqAdminResponse.model_validate(f)

    @staticmethod
    def create(db: Session, payload: FaqCreate, actor: AdminUser, request: Request) -> FaqAdminResponse:
        f = FaqsService.create_faq(db, payload.model_dump(), actor, request)
        return FaqAdminResponse.model_validate(f)

    @staticmethod
    def update(db: Session, faq_id: UUID, payload: FaqUpdate, actor: AdminUser, request: Request) -> FaqAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        f = FaqsService.update_faq(db, faq_id, data, actor, request)
        return FaqAdminResponse.model_validate(f)

    @staticmethod
    def delete(db: Session, faq_id: UUID, actor: AdminUser, request: Request) -> None:
        FaqsService.soft_delete_faq(db, faq_id, actor, request)

    @staticmethod
    def restore(db: Session, faq_id: UUID, actor: AdminUser, request: Request) -> FaqAdminResponse:
        f = FaqsService.restore_faq(db, faq_id, actor, request)
        return FaqAdminResponse.model_validate(f)
