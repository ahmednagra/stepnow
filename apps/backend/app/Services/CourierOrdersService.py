# apps/backend/app/Services/CourierOrdersService.py
# Parcel-dispatch logic layered on the existing orders domain. Creates a manual courier
# order (no booking), and advances the MANUAL delivery lifecycle separate from the financial
# status. Money + numbering reuse app.Utils.finance so the §14 rules live in one place.

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.customers import Customer
from app.Models.drivers import Driver
from app.Models.orders import Order
from app.Services.AuditService import AuditService
from app.Services.CustomersService import CustomersService
from app.Utils.finance import compute_totals, next_sequence_number, year_prefix

DEFAULT_VAT_RATE = Decimal("0.0700")
DELIVERY_FLOW = ["draft", "dispatched", "picked_up", "delivered"]


class CourierOrdersService:

    @staticmethod
    def _snapshot(o: Order) -> dict:
        return {
            "order_number": o.order_number, "status": o.status,
            "delivery_status": o.delivery_status, "driver_id": str(o.driver_id) if o.driver_id else None,
            "net_amount": str(o.net_amount), "gross_amount": str(o.gross_amount),
        }

    @staticmethod
    def _resolve_customer(db: Session, payload, actor: AdminUser, request: Request | None) -> Customer:
        if payload.customer_id:
            return CustomersService.get(db, payload.customer_id, allow_deleted=False)
        if payload.customer:
            return CustomersService.create(db, payload.customer.model_dump(), actor, request)
        raise ConflictError("Provide customer_id or inline customer data")

    @staticmethod
    def create_manual(db: Session, payload, actor: AdminUser, request: Request | None = None) -> Order:
        customer = CourierOrdersService._resolve_customer(db, payload, actor, request)

        driver = None
        if payload.driver_id:
            driver = db.query(Driver).filter(Driver.id == payload.driver_id, Driver.is_deleted == False).first()  # noqa: E712
            if not driver:
                raise NotFoundError("Driver not found", driver_id=str(payload.driver_id))

        display_name = (
            customer.company_name if customer.is_business and customer.company_name
            else f"{customer.first_name} {customer.last_name}"
        )
        rate = payload.vat_rate if payload.vat_rate is not None else DEFAULT_VAT_RATE
        net, vat, gross = compute_totals(payload.net_amount, rate)
        due_date = date.today() + timedelta(days=payload.payment_due_days)

        order = Order(
            order_number=next_sequence_number(db, Order.order_number, year_prefix()),
            booking_id=None,
            status="open",
            delivery_status="draft",
            customer_id=customer.id,
            driver_id=driver.id if driver else None,
            customer_name=display_name,
            customer_phone=customer.phone,
            customer_email=customer.email,
            is_business=customer.is_business,
            company_name=customer.company_name,
            company_vatid=customer.company_vatid,
            pickup_address=payload.pickup_address,
            pickup_city=payload.pickup_city,
            destination_address=payload.destination_address,
            destination_city=payload.destination_city,
            consignee=payload.consignee,
            parcel_description=payload.parcel_description,
            parcel_quantity=payload.parcel_quantity,
            parcel_weight_kg=payload.parcel_weight_kg,
            scheduled_datetime=payload.scheduled_datetime,
            driver_name=driver.full_name if driver else None,
            service_description=payload.service_description,
            net_amount=net, vat_rate=rate, vat_amount=vat, gross_amount=gross,
            payment_due_days=payload.payment_due_days, due_date=due_date,
            internal_notes=payload.internal_notes,
        )
        db.add(order)
        db.flush()
        AuditService.log(db, actor, "orders", str(order.id), "create", None, CourierOrdersService._snapshot(order), request)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def update_fields(db: Session, order_id: UUID, payload, actor: AdminUser, request: Request) -> Order:
        from app.Services.OrdersService import OrdersService
        o = OrdersService.get(db, order_id)
        before = CourierOrdersService._snapshot(o)
        # re-resolve customer/driver links + courier fields + money
        if payload.driver_id is not None:
            o.driver_id = payload.driver_id
            drv = db.query(Driver).filter(Driver.id == payload.driver_id).first()
            o.driver_name = drv.full_name if drv else o.driver_name
        for f in ("pickup_address", "pickup_city", "destination_address", "destination_city",
                  "consignee", "parcel_description", "parcel_quantity", "parcel_weight_kg",
                  "scheduled_datetime", "service_description", "internal_notes"):
            setattr(o, f, getattr(payload, f))
        rate = payload.vat_rate if payload.vat_rate is not None else o.vat_rate
        net, vat, gross = compute_totals(payload.net_amount, rate)
        o.net_amount, o.vat_rate, o.vat_amount, o.gross_amount = net, rate, vat, gross
        o.due_date = date.today() + timedelta(days=payload.payment_due_days)
        o.payment_due_days = payload.payment_due_days
        AuditService.log(db, actor, "orders", str(o.id), "update", before, CourierOrdersService._snapshot(o), request)
        db.commit()
        db.refresh(o)
        return o

    @staticmethod
    def set_delivery_status(db: Session, order_id: UUID, new_status: str, actor: AdminUser, request: Request) -> Order:
        from app.Services.OrdersService import OrdersService
        o = OrdersService.get(db, order_id)
        cur_i = DELIVERY_FLOW.index(o.delivery_status) if o.delivery_status in DELIVERY_FLOW else 0
        new_i = DELIVERY_FLOW.index(new_status)
        if new_i not in (cur_i, cur_i + 1):
            raise ConflictError(f"Cannot move delivery status from {o.delivery_status} to {new_status}")
        before = CourierOrdersService._snapshot(o)
        now = datetime.now(timezone.utc)
        o.delivery_status = new_status
        if new_status == "dispatched" and not o.dispatched_at:
            o.dispatched_at = now
        elif new_status == "picked_up":
            o.picked_up_at = now
        elif new_status == "delivered":
            o.delivered_at = now
        AuditService.log(db, actor, "orders", str(o.id), "update", before, CourierOrdersService._snapshot(o), request)
        db.commit()
        db.refresh(o)
        return o

    @staticmethod
    def list(db: Session, page: int, size: int, delivery_status: str | None, q: str | None, include_deleted: bool):
        query = db.query(Order)
        if not include_deleted:
            query = query.filter(Order.is_deleted == False)  # noqa: E712
        if delivery_status:
            query = query.filter(Order.delivery_status == delivery_status)
        if q:
            like = f"%{q}%"
            query = query.filter((Order.order_number.ilike(like)) | (Order.customer_name.ilike(like)))
        total = query.count()
        items = query.order_by(Order.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total
