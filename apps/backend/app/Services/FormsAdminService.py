# apps/backend/app/Services/FormsAdminService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.bookings import BookingRequest
from app.Models.contact import ContactMessage
from app.Services.AuditService import AuditService

_BOOKING_FIELDS = ("status", "quoted_price_eur", "quoted_at", "completed_at", "internal_notes")
_CONTACT_FIELDS = ("is_handled", "handled_at", "internal_notes")


class FormsAdminService:

    @staticmethod
    def list_bookings(db: Session, page: int, size: int, status: str | None, q: str | None, include_deleted: bool) -> tuple[list[BookingRequest], int]:
        query = db.query(BookingRequest)
        if not include_deleted:
            query = query.filter(BookingRequest.is_deleted == False)
        if status:
            query = query.filter(BookingRequest.status == status)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(BookingRequest.reference.ilike(like), BookingRequest.customer_name.ilike(like), BookingRequest.customer_email.ilike(like), BookingRequest.customer_phone.ilike(like)))
        total = query.with_entities(func.count(BookingRequest.id)).scalar() or 0
        items = query.order_by(BookingRequest.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_booking(db: Session, booking_id: UUID, allow_deleted: bool = False) -> BookingRequest:
        query = db.query(BookingRequest).filter(BookingRequest.id == booking_id)
        if not allow_deleted:
            query = query.filter(BookingRequest.is_deleted == False)
        b = query.first()
        if not b:
            raise NotFoundError("Booking not found", booking_id=str(booking_id))
        return b

    @staticmethod
    def update_booking(db: Session, booking_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> BookingRequest:
        b = FormsAdminService.get_booking(db, booking_id)
        before = FormsAdminService._snapshot_booking(b)
        # Auto-stamp timestamps based on status transitions
        new_status = data.get("status")
        if new_status == "quoted" and not b.quoted_at:
            b.quoted_at = datetime.now(timezone.utc)
        if new_status == "completed" and not b.completed_at:
            b.completed_at = datetime.now(timezone.utc)
        for k, v in data.items():
            setattr(b, k, v)
        db.flush()
        AuditService.log(db, actor, "booking_requests", str(b.id), "update", before, FormsAdminService._snapshot_booking(b), request)
        db.commit()
        db.refresh(b)
        return b

    @staticmethod
    def soft_delete_booking(db: Session, booking_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        b = FormsAdminService.get_booking(db, booking_id)
        before = FormsAdminService._snapshot_booking(b)
        b.is_deleted = True
        b.deleted_at = datetime.now(timezone.utc)
        b.deleted_by = actor.id
        AuditService.log(db, actor, "booking_requests", str(b.id), "soft_delete", before, FormsAdminService._snapshot_booking(b), request)
        db.commit()

    @staticmethod
    def list_contact_messages(db: Session, page: int, size: int, category: str | None, is_handled: bool | None, q: str | None, include_deleted: bool) -> tuple[list[ContactMessage], int]:
        query = db.query(ContactMessage)
        if not include_deleted:
            query = query.filter(ContactMessage.is_deleted == False)
        if category:
            query = query.filter(ContactMessage.subject_category == category)
        if is_handled is not None:
            query = query.filter(ContactMessage.is_handled == is_handled)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(ContactMessage.name.ilike(like), ContactMessage.email.ilike(like), ContactMessage.message.ilike(like)))
        total = query.with_entities(func.count(ContactMessage.id)).scalar() or 0
        items = query.order_by(ContactMessage.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_contact_message(db: Session, message_id: UUID, allow_deleted: bool = False) -> ContactMessage:
        query = db.query(ContactMessage).filter(ContactMessage.id == message_id)
        if not allow_deleted:
            query = query.filter(ContactMessage.is_deleted == False)
        m = query.first()
        if not m:
            raise NotFoundError("Contact message not found", message_id=str(message_id))
        return m

    @staticmethod
    def update_contact_message(db: Session, message_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> ContactMessage:
        m = FormsAdminService.get_contact_message(db, message_id)
        before = FormsAdminService._snapshot_contact(m)
        # Auto-stamp handled_at on transition to is_handled=True
        if data.get("is_handled") is True and not m.is_handled:
            m.handled_at = datetime.now(timezone.utc)
        if data.get("is_handled") is False:
            m.handled_at = None
        for k, v in data.items():
            setattr(m, k, v)
        db.flush()
        AuditService.log(db, actor, "contact_messages", str(m.id), "update", before, FormsAdminService._snapshot_contact(m), request)
        db.commit()
        db.refresh(m)
        return m

    @staticmethod
    def soft_delete_contact_message(db: Session, message_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        m = FormsAdminService.get_contact_message(db, message_id)
        before = FormsAdminService._snapshot_contact(m)
        m.is_deleted = True
        m.deleted_at = datetime.now(timezone.utc)
        m.deleted_by = actor.id
        AuditService.log(db, actor, "contact_messages", str(m.id), "soft_delete", before, FormsAdminService._snapshot_contact(m), request)
        db.commit()

    @staticmethod
    def _snapshot_booking(b: BookingRequest) -> dict[str, Any]:
        return {f: FormsAdminService._serialize(getattr(b, f)) for f in _BOOKING_FIELDS}

    @staticmethod
    def _snapshot_contact(m: ContactMessage) -> dict[str, Any]:
        return {f: FormsAdminService._serialize(getattr(m, f)) for f in _CONTACT_FIELDS}

    @staticmethod
    def _serialize(value: Any) -> Any:
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return value
