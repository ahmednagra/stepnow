# apps/backend/app/Http/Controllers/FormsController.py
from datetime import datetime, timezone
from fastapi import BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.Schemas.forms import BookingCreate, BookingSubmitted, ContactCreate, ContactSubmitted
from app.Services.FormsService import FormsService
from app.Http.Controllers._background import dispatch_emails as _dispatch_emails


class FormsController:

    @staticmethod
    def submit_booking(db: Session, payload: BookingCreate, request: Request, background_tasks: BackgroundTasks) -> BookingSubmitted:
        booking, email_log_ids = FormsService.submit_booking(db, payload.model_dump(), request)
        background_tasks.add_task(_dispatch_emails, email_log_ids)
        if booking is None:
            # Honeypot triggered — return a generic plausible response.
            return BookingSubmitted(reference="SN-00000000-000000", submitted_at=datetime.now(timezone.utc))
        return BookingSubmitted(reference=booking.reference, submitted_at=booking.created_at)

    @staticmethod
    def submit_contact(db: Session, payload: ContactCreate, request: Request, background_tasks: BackgroundTasks) -> ContactSubmitted:
        message, email_log_ids = FormsService.submit_contact(db, payload.model_dump(), request)
        background_tasks.add_task(_dispatch_emails, email_log_ids)
        if message is None:
            return ContactSubmitted(submitted_at=datetime.now(timezone.utc))
        return ContactSubmitted(submitted_at=message.created_at)
