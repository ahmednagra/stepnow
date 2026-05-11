# apps/backend/app/Http/Controllers/admin/FormsAdminController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.forms_admin import (
    BookingAdminResponse,
    BookingStatusUpdate,
    ContactMessageAdminResponse,
    ContactMessageUpdate,
)
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Services.FormsAdminService import FormsAdminService


class FormsAdminController:

    @staticmethod
    def list_bookings(db: Session, page: int, size: int, status: str | None, q: str | None, include_deleted: bool) -> PaginatedResponse[BookingAdminResponse]:
        items, total = FormsAdminService.list_bookings(db, page, size, status, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[BookingAdminResponse](
            items=[BookingAdminResponse.model_validate(b) for b in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get_booking(db: Session, booking_id: UUID) -> BookingAdminResponse:
        b = FormsAdminService.get_booking(db, booking_id, allow_deleted=True)
        return BookingAdminResponse.model_validate(b)

    @staticmethod
    def update_booking(db: Session, booking_id: UUID, payload: BookingStatusUpdate, actor: AdminUser, request: Request) -> BookingAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        b = FormsAdminService.update_booking(db, booking_id, data, actor, request)
        return BookingAdminResponse.model_validate(b)

    @staticmethod
    def delete_booking(db: Session, booking_id: UUID, actor: AdminUser, request: Request) -> None:
        FormsAdminService.soft_delete_booking(db, booking_id, actor, request)

    @staticmethod
    def list_contact_messages(db: Session, page: int, size: int, category: str | None, is_handled: bool | None, q: str | None, include_deleted: bool) -> PaginatedResponse[ContactMessageAdminResponse]:
        items, total = FormsAdminService.list_contact_messages(db, page, size, category, is_handled, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[ContactMessageAdminResponse](
            items=[ContactMessageAdminResponse.model_validate(m) for m in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get_contact_message(db: Session, message_id: UUID) -> ContactMessageAdminResponse:
        m = FormsAdminService.get_contact_message(db, message_id, allow_deleted=True)
        return ContactMessageAdminResponse.model_validate(m)

    @staticmethod
    def update_contact_message(db: Session, message_id: UUID, payload: ContactMessageUpdate, actor: AdminUser, request: Request) -> ContactMessageAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        m = FormsAdminService.update_contact_message(db, message_id, data, actor, request)
        return ContactMessageAdminResponse.model_validate(m)

    @staticmethod
    def delete_contact_message(db: Session, message_id: UUID, actor: AdminUser, request: Request) -> None:
        FormsAdminService.soft_delete_contact_message(db, message_id, actor, request)
