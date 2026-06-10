# apps/backend/app/Http/Controllers/admin/CourierController.py
# Thin controller for the parcel-dispatch feature. Logic lives in CourierOrdersService /
# DriverSlipPdfService; email follows the queue + BackgroundTasks pattern from FormsController.

import math
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID
from fastapi import BackgroundTasks, Request
from sqlalchemy.orm import Session
from config.database import SessionLocal
from app.Core.Exceptions import ConflictError
from app.Models.admin import AdminUser
from app.Models.drivers import Driver
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.admin.courier_admin import (
    CourierOrderResponse, DeliveryStatusUpdate, ParcelOrderCreate, SendSlipRequest,
)
from app.Services.AuditService import AuditService
from app.Services.CourierOrdersService import CourierOrdersService
from app.Services.DriverSlipPdfService import DriverSlipPdfService
from app.Services.EmailService import EmailService
from app.Services.OrdersService import OrdersService


def _dispatch_emails(email_log_ids: list[int]) -> None:
    # Runs after the response is sent; opens its own DB session (mirrors FormsController).
    if not email_log_ids:
        return
    db = SessionLocal()
    try:
        for log_id in email_log_ids:
            EmailService.dispatch_pending(db, log_id)
    finally:
        db.close()


class CourierController:

    @staticmethod
    def create(db: Session, payload: ParcelOrderCreate, actor: AdminUser, request: Request) -> CourierOrderResponse:
        order = CourierOrdersService.create_manual(db, payload, actor, request)
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def update(db: Session, order_id: UUID, payload: ParcelOrderCreate, actor: AdminUser, request: Request) -> CourierOrderResponse:
        order = CourierOrdersService.update_fields(db, order_id, payload, actor, request)
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def list(db: Session, page: int, size: int, delivery_status: str | None, q: str | None, include_deleted: bool) -> PaginatedResponse[CourierOrderResponse]:
        items, total = CourierOrdersService.list(db, page, size, delivery_status, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[CourierOrderResponse](
            items=[CourierOrderResponse.model_validate(o) for o in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def set_delivery_status(db: Session, order_id: UUID, payload: DeliveryStatusUpdate, actor: AdminUser, request: Request) -> CourierOrderResponse:
        order = CourierOrdersService.set_delivery_status(db, order_id, payload.delivery_status, actor, request)
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def slip_pdf_path(db: Session, order_id: UUID) -> str:
        order = OrdersService.get(db, order_id)
        path = order.driver_slip_pdf_url
        if not path or not Path(path).exists():
            path = DriverSlipPdfService.render(db, order)
            order.driver_slip_pdf_url = path
            db.commit()
            db.refresh(order)
        return str(Path(path).resolve())

    @staticmethod
    def send(db: Session, order_id: UUID, payload: SendSlipRequest, actor: AdminUser, request: Request, background_tasks: BackgroundTasks) -> CourierOrderResponse:
        order = OrdersService.get(db, order_id)
        now = datetime.now(timezone.utc)
        queued: list[int] = []

        if "driver" in payload.to:
            driver = db.get(Driver, order.driver_id) if order.driver_id else None
            if not driver:
                raise ConflictError("No driver assigned to this order")
            if not driver.email:
                raise ConflictError("Assigned driver has no email address")
            # ensure the slip PDF exists (stored, authed-streamed; not attached by the log-only provider)
            if not order.driver_slip_pdf_url or not Path(order.driver_slip_pdf_url).exists():
                order.driver_slip_pdf_url = DriverSlipPdfService.render(db, order)
            order.driver_emailed_at = now
            if order.delivery_status == "draft":
                order.delivery_status = "dispatched"
                order.dispatched_at = now
            log = EmailService.queue(
                db, to_address=driver.email, template="driver_slip",
                subject=f"Fahrauftrag {order.order_number}", locale="de",
                extra={
                    "order_number": order.order_number,
                    "pickup": order.pickup_address,
                    "destination": order.destination_address,
                    "driver_name": driver.full_name,
                },
                module="courier_driver",
            )
            queued.append(log.id)

        if "customer" in payload.to:
            if not order.invoice:
                raise ConflictError("Order has no invoice yet — create the invoice first (POST /admin/orders/{id}/invoice)")
            if not order.customer_email:
                raise ConflictError("Customer has no email address")
            log = EmailService.queue(
                db, to_address=order.customer_email, template="customer_invoice",
                subject=f"Rechnung {order.invoice.invoice_number}", locale="de",
                extra={"invoice_number": order.invoice.invoice_number, "order_number": order.order_number},
                module="courier_invoice",
            )
            queued.append(log.id)

        if not queued:
            raise ConflictError("Nothing to send (use to=['driver'] and/or ['customer'])")

        AuditService.log(db, actor, "orders", str(order.id), "update",
                         None, {"sent": payload.to, "delivery_status": order.delivery_status}, request)
        db.commit()
        db.refresh(order)
        background_tasks.add_task(_dispatch_emails, queued)
        return CourierOrderResponse.model_validate(order)
