# apps/backend/app/Services/OrdersService.py
# Business logic for orders. Static-method + AuditService pattern (matches PricingService /
# FormsAdminService). Money + numbering go through app.Utils.finance so the rules live once.

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.bookings import BookingRequest
from app.Models.orders import Order
from app.Services.AuditService import AuditService
from app.Services.EmailService import EmailService
from app.Utils.finance import compute_totals, next_sequence_number, order_date_sequence_number, year_prefix

DEFAULT_VAT_RATE = Decimal("0.0700")  # reduced rate (PBefG short-distance passenger transport)


class OrdersService:

    @staticmethod
    def _snapshot(o: Order) -> dict:
        return {
            "order_number": o.order_number, "status": o.status,
            "net_amount": str(o.net_amount), "vat_rate": str(o.vat_rate),
            "gross_amount": str(o.gross_amount),
            "booking_id": str(o.booking_id) if o.booking_id else None,
        }

    @staticmethod
    def create_from_booking(db: Session, booking_id: UUID, payload, actor: AdminUser, request: Request | None = None) -> Order:
        booking = (
            db.query(BookingRequest)
            .filter(BookingRequest.id == booking_id, BookingRequest.is_deleted == False)  # noqa: E712
            .first()
        )
        if not booking:
            raise NotFoundError("Booking not found", booking_id=str(booking_id))

        # idempotency — one order per booking (also enforced by uq_orders_booking_id)
        existing = db.query(Order).filter(Order.booking_id == booking_id).first()
        if existing:
            raise ConflictError("Booking already converted to an order", order_number=existing.order_number)

        rate = payload.vat_rate if payload.vat_rate is not None else DEFAULT_VAT_RATE
        net, vat, gross = compute_totals(payload.net_amount, rate)
        due_date = date.today() + timedelta(days=payload.payment_due_days)

        order = Order(
            order_number=order_date_sequence_number(db, Order.order_number),
            booking_id=booking.id,
            service_id=booking.service_id,
            vehicle_id=payload.vehicle_id,
            status="open",
            customer_name=booking.customer_name,
            customer_phone=booking.customer_phone,
            customer_email=booking.customer_email,
            is_business=booking.is_business,
            company_name=booking.company_name,
            company_vatid=booking.company_vatid,
            pickup_address=booking.pickup_address,
            pickup_postcode=booking.pickup_postcode,
            pickup_city=booking.pickup_city,
            destination_address=booking.destination_address,
            destination_postcode=booking.destination_postcode,
            destination_city=booking.destination_city,
            scheduled_datetime=payload.scheduled_datetime or booking.requested_datetime,
            passenger_count=booking.passenger_count,
            luggage_count=booking.luggage_count,
            distance_km=payload.distance_km,
            driver_name=payload.driver_name,
            service_description=payload.service_description,
            net_amount=net, vat_rate=rate, vat_amount=vat, gross_amount=gross,
            payment_due_days=payload.payment_due_days, due_date=due_date,
            internal_notes=payload.internal_notes,
        )
        db.add(order)
        db.flush()

        booking.status = "confirmed"

        AuditService.log(db, actor, "orders", str(order.id), "create", None, OrdersService._snapshot(order), request)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get(db: Session, order_id: UUID, allow_deleted: bool = True) -> Order:
        q = db.query(Order).filter(Order.id == order_id)
        if not allow_deleted:
            q = q.filter(Order.is_deleted == False)  # noqa: E712
        o = q.first()
        if not o:
            raise NotFoundError("Order not found", order_id=str(order_id))
        return o

    @staticmethod
    def list(db: Session, page: int, size: int, status: str | None, q: str | None, include_deleted: bool):
        query = db.query(Order)
        if not include_deleted:
            query = query.filter(Order.is_deleted == False)  # noqa: E712
        if status:
            query = query.filter(Order.status == status)
        if q:
            like = f"%{q}%"
            query = query.filter(
                (Order.order_number.ilike(like))
                | (Order.customer_name.ilike(like))
                | (Order.customer_email.ilike(like))
            )
        total = query.count()
        items = query.order_by(Order.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def update(db: Session, order_id: UUID, data: dict, actor: AdminUser, request: Request) -> Order:
        o = OrdersService.get(db, order_id)
        before = OrdersService._snapshot(o)
        if data.get("status"):
            o.status = data["status"]
            if data["status"] == "completed" and not o.completed_at:
                o.completed_at = datetime.now(timezone.utc)
            if data["status"] == "cancelled" and not o.cancelled_at:
                o.cancelled_at = datetime.now(timezone.utc)
            if data["status"] in ("confirmed", "cancelled", "quoted") and o.customer_email:
                _subject = {
                    "confirmed": f"Buchung {o.order_number} bestätigt",
                    "cancelled": f"Buchung {o.order_number} storniert",
                    "quoted": f"Ihr Angebot für Buchung {o.order_number}",
                }.get(data["status"], "")
                EmailService.queue(
                    db, o.customer_email, "booking_status_update",
                    _subject, "de",
                    extra={
                        "reference": o.order_number,
                        "status": data["status"],
                        "quoted_price": str(o.net_amount or ""),
                        "customer_name": o.customer_name,
                    },
                    module="booking",
                )
        if "driver_name" in data:
            o.driver_name = data["driver_name"]
        if "internal_notes" in data:
            o.internal_notes = data["internal_notes"]
        AuditService.log(db, actor, "orders", str(o.id), "update", before, OrdersService._snapshot(o), request)
        db.commit()
        db.refresh(o)
        return o

    @staticmethod
    def soft_delete(db: Session, order_id: UUID, actor: AdminUser, request: Request) -> None:
        o = OrdersService.get(db, order_id)
        before = OrdersService._snapshot(o)
        o.is_deleted = True
        o.deleted_at = datetime.now(timezone.utc)
        o.deleted_by = actor.id
        AuditService.log(db, actor, "orders", str(o.id), "delete", before, OrdersService._snapshot(o), request)
        db.commit()
