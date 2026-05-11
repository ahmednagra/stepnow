# apps/backend/routes/api/v0/admin/forms_admin.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.FormsAdminController import FormsAdminController
from app.Models.admin import AdminUser
from app.Schemas.admin.forms_admin import (
    BookingAdminResponse,
    BookingStatusUpdate,
    ContactMessageAdminResponse,
    ContactMessageUpdate,
)
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: bookings + contact"])


# Bookings
@router.get("/admin/bookings", response_model=PaginatedResponse[BookingAdminResponse])
async def list_bookings(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, max_length=20),
    q: str | None = Query(None, max_length=200),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[BookingAdminResponse]:
    return FormsAdminController.list_bookings(db, page, size, status, q, include_deleted)


@router.get("/admin/bookings/{booking_id}", response_model=BookingAdminResponse)
async def get_booking(booking_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> BookingAdminResponse:
    return FormsAdminController.get_booking(db, booking_id)


@router.patch("/admin/bookings/{booking_id}", response_model=BookingAdminResponse)
async def update_booking(request: Request, booking_id: UUID, payload: BookingStatusUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> BookingAdminResponse:
    return FormsAdminController.update_booking(db, booking_id, payload, actor, request)


@router.delete("/admin/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(request: Request, booking_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    FormsAdminController.delete_booking(db, booking_id, actor, request)


# Contact messages
@router.get("/admin/contact-messages", response_model=PaginatedResponse[ContactMessageAdminResponse])
async def list_messages(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, max_length=50),
    is_handled: bool | None = Query(None),
    q: str | None = Query(None, max_length=200),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[ContactMessageAdminResponse]:
    return FormsAdminController.list_contact_messages(db, page, size, category, is_handled, q, include_deleted)


@router.get("/admin/contact-messages/{message_id}", response_model=ContactMessageAdminResponse)
async def get_message(message_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ContactMessageAdminResponse:
    return FormsAdminController.get_contact_message(db, message_id)


@router.patch("/admin/contact-messages/{message_id}", response_model=ContactMessageAdminResponse)
async def update_message(request: Request, message_id: UUID, payload: ContactMessageUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ContactMessageAdminResponse:
    return FormsAdminController.update_contact_message(db, message_id, payload, actor, request)


@router.delete("/admin/contact-messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(request: Request, message_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    FormsAdminController.delete_contact_message(db, message_id, actor, request)
