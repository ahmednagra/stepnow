# apps/backend/app/Http/Controllers/FormsController.py
from datetime import datetime, timezone
from fastapi import BackgroundTasks, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Models.settings import SiteSettings
from app.Models.vehicles import Vehicle
from app.Schemas.forms import BookingCreate, BookingSubmitted, ContactCreate, ContactSubmitted
from app.Schemas.public import PublicFleetVehicle, PublicOrderSubmitted, StaffGateResult
from app.Services.FormsService import FormsService
from app.Services.CourierOrdersService import CourierOrdersService
from app.Http.Controllers._background import dispatch_emails as _dispatch_emails

SYSTEM_ACTOR_EMAIL = "system@stepnow.local"


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

    # ── No-login worker order creation (shared staff code gate) ──
    @staticmethod
    def _staff_code(db: Session) -> str | None:
        return db.query(SiteSettings.staff_access_code).filter(SiteSettings.id == 1).scalar()

    @staticmethod
    def verify_staff_code(db: Session, code: str) -> StaffGateResult:
        configured = FormsController._staff_code(db)
        return StaffGateResult(ok=bool(configured and code.strip() == configured.strip()))

    @staticmethod
    def fleet_vehicles(db: Session) -> list[PublicFleetVehicle]:
        rows = (
            db.query(Vehicle)
            .filter(Vehicle.is_deleted == False, Vehicle.active == True, Vehicle.plate.isnot(None))  # noqa: E712
            .order_by(Vehicle.plate.asc())
            .all()
        )
        return [PublicFleetVehicle(id=v.id, label=v.plate or v.name_de) for v in rows]

    @staticmethod
    def create_public_order(db: Session, payload, request: Request) -> PublicOrderSubmitted:
        configured = FormsController._staff_code(db)
        if not configured or payload.staff_access_code.strip() != configured.strip():
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Invalid staff code.")
        actor = db.query(AdminUser).filter(AdminUser.email == SYSTEM_ACTOR_EMAIL).first()
        if not actor:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="System actor missing — run the seeders.")
        order = CourierOrdersService.create_manual(db, payload, actor, request, created_via="public")
        return PublicOrderSubmitted(id=order.id, order_number=order.order_number)
