# apps/backend/app/Services/FormsService.py
import secrets
from datetime import datetime, timezone
from typing import Any
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import DomainError
from app.Models.bookings import BookingRequest
from app.Models.contact import ContactMessage
from app.Services.AuditService import AuditService
from app.Services.EmailService import EmailService
from app.Services.SettingsService import SettingsService


class FormsService:

    @staticmethod
    def submit_booking(db: Session, data: dict[str, Any], request: Request | None = None) -> tuple[BookingRequest | None, list[int]]:
        # Honeypot: silently drop bots. Return None to caller; route returns 201 anyway.
        if data.get("website"):
            return None, []
        if not data.get("consent_dsgvo"):
            raise DomainError("DSGVO consent required", field="consent_dsgvo")
        reference = FormsService._generate_booking_reference()
        booking = BookingRequest(
            reference=reference,
            status="new",
            service_id=data.get("service_id"),
            pickup_address=data["pickup_address"],
            pickup_postcode=data.get("pickup_postcode"),
            pickup_city=data.get("pickup_city"),
            destination_address=data["destination_address"],
            destination_postcode=data.get("destination_postcode"),
            destination_city=data.get("destination_city"),
            requested_datetime=data["requested_datetime"],
            passenger_count=data.get("passenger_count", 1),
            luggage_count=data.get("luggage_count", 0),
            special_requirements=data.get("special_requirements"),
            customer_name=data["customer_name"],
            customer_phone=data["customer_phone"],
            customer_email=data["customer_email"],
            is_business=data.get("is_business", False),
            company_name=data.get("company_name"),
            company_vatid=data.get("company_vatid"),
            language=data.get("language", "de"),
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        db.add(booking)
        db.flush()
        email_log_ids = FormsService._queue_booking_emails(db, booking)
        AuditService.log(db, None, "booking_requests", str(booking.id), "submit", None, {"reference": reference, "customer_email": booking.customer_email, "is_business": booking.is_business}, request)
        db.commit()
        db.refresh(booking)
        return booking, email_log_ids

    @staticmethod
    def submit_contact(db: Session, data: dict[str, Any], request: Request | None = None) -> tuple[ContactMessage | None, list[int]]:
        if data.get("website"):
            return None, []
        if not data.get("consent_dsgvo"):
            raise DomainError("DSGVO consent required", field="consent_dsgvo")
        message = ContactMessage(
            subject_category=data.get("subject_category", "general"),
            name=data["name"],
            email=data["email"],
            phone=data.get("phone"),
            message=data["message"],
            language=data.get("language", "de"),
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        db.add(message)
        db.flush()
        email_log_ids = FormsService._queue_contact_emails(db, message)
        AuditService.log(db, None, "contact_messages", str(message.id), "submit", None, {"name": message.name, "email": message.email, "category": message.subject_category}, request)
        db.commit()
        db.refresh(message)
        return message, email_log_ids

    @staticmethod
    def _generate_booking_reference() -> str:
        now = datetime.now(timezone.utc)
        suffix = secrets.token_hex(3).upper()
        return f"SN-{now.strftime('%Y%m%d')}-{suffix}"

    @staticmethod
    def _queue_booking_emails(db: Session, booking: BookingRequest) -> list[int]:
        settings = SettingsService.get_or_none(db)
        owner_email = settings.email if settings else "info@step-now.de"
        ids: list[int] = []
        owner_log = EmailService.queue(
            db, owner_email, "booking_owner_notification",
            f"Neue Buchungsanfrage {booking.reference}", booking.language,
            extra={"booking_id": str(booking.id), "reference": booking.reference, "customer_email": booking.customer_email, "customer_phone": booking.customer_phone},
            module="booking",
        )

        ids.append(owner_log.id)
        customer_log = EmailService.queue(
            db, booking.customer_email, "booking_customer_confirmation",
            f"Buchungsbestätigung {booking.reference}" if booking.language == "de" else f"Booking confirmation {booking.reference}",
            booking.language,
            extra={"booking_id": str(booking.id), "reference": booking.reference},
            module="booking",
        )
        ids.append(customer_log.id)
        return ids

    @staticmethod
    def _queue_contact_emails(db: Session, message: ContactMessage) -> list[int]:
        settings = SettingsService.get_or_none(db)
        owner_email = settings.email if settings else "info@step-now.de"
        ids: list[int] = []
        owner_log = EmailService.queue(
            db, owner_email, "contact_owner_notification",
            f"Kontaktanfrage von {message.name}", message.language,
            extra={"message_id": str(message.id), "category": message.subject_category, "from_email": message.email},
            module="contact",
        )
        ids.append(owner_log.id)
        customer_log = EmailService.queue(
            db, message.email, "contact_customer_confirmation",
            "Vielen Dank für Ihre Nachricht" if message.language == "de" else "Thank you for your message",
            message.language,
            extra={"message_id": str(message.id)},
            module="contact",
        )
        ids.append(customer_log.id)
        return ids
