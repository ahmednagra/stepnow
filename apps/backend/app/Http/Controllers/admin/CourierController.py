# apps/backend/app/Http/Controllers/admin/CourierController.py
# Thin controller for the parcel-dispatch feature. Logic lives in CourierOrdersService /
# DriverSlipPdfService; email follows the queue + BackgroundTasks pattern from FormsController.

from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID
from fastapi import BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import AppError, ConflictError
from app.Models.admin import AdminUser
from app.Models.drivers import Driver
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.courier_admin import (
    CourierOrderResponse, DeliveryStatusUpdate, ParcelOrderCreate, SendSlipRequest,
)
from app.Services.AuditService import AuditService
from app.Services.CourierOrdersService import CourierOrdersService
from app.Services.DriverSlipPdfService import DriverSlipPdfService
from app.Services.EmailService import EmailService
from app.Services.OrdersService import OrdersService
from app.Http.Controllers._background import notify_admins as _notify_admins, dispatch_emails as _dispatch_emails
from app.Services.message_delivery.MessageDeliveryService import MessageDeliveryService
from app.Utils.Logger import get_logger

logger = get_logger("courier_controller")


class CourierController:

    @staticmethod
    def create(db: Session, payload: ParcelOrderCreate, actor: AdminUser, request: Request, background_tasks: BackgroundTasks) -> CourierOrderResponse:
        order = CourierOrdersService.create_manual(db, payload, actor, request)
        background_tasks.add_task(
            _notify_admins, "order.created",
            f"New order {order.order_number}", order.customer_name,
            f"/admin/orders/{order.id}",
            {"order_number": order.order_number, "customer_name": order.customer_name},
            actor.id,
        )
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def update(db: Session, order_id: UUID, payload: ParcelOrderCreate, actor: AdminUser, request: Request) -> CourierOrderResponse:
        order = CourierOrdersService.update_fields(db, order_id, payload, actor, request)
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def list(db: Session, page: int, size: int, delivery_status: str | None, q: str | None, include_deleted: bool) -> PaginatedResponse[CourierOrderResponse]:
        items, total = CourierOrdersService.list(db, page, size, delivery_status, q, include_deleted)
        return PaginatedResponse[CourierOrderResponse].build(
            [CourierOrderResponse.model_validate(o) for o in items], page, size, total
        )

    @staticmethod
    def set_delivery_status(db: Session, order_id: UUID, payload: DeliveryStatusUpdate, actor: AdminUser, request: Request, background_tasks: BackgroundTasks) -> CourierOrderResponse:
        order = CourierOrdersService.set_delivery_status(db, order_id, payload.delivery_status, actor, request)
        # Notify on completion (delivered) — the "order completes" step.
        if order.delivery_status == "delivered":
            background_tasks.add_task(
                _notify_admins, "order.completed",
                f"Order {order.order_number} delivered", order.customer_name,
                f"/admin/orders/{order.id}",
                {"order_number": order.order_number, "delivery_status": order.delivery_status},
                actor.id,
            )
        return CourierOrderResponse.model_validate(order)

    @staticmethod
    def slip_pdf_path(db: Session, order_id: UUID) -> str:
        order = OrdersService.get(db, order_id)
        return DriverSlipPdfService.ensure(db, order)

    @staticmethod
    def send(db: Session, order_id: UUID, payload: SendSlipRequest, actor: AdminUser, request: Request, background_tasks: BackgroundTasks) -> CourierOrderResponse:
        order = OrdersService.get(db, order_id)

        if payload.channel == "whatsapp":
            if payload.to != ["driver"]:
                raise ConflictError("WhatsApp send currently supports the driver slip only (to=['driver'])")
            driver = db.get(Driver, order.driver_id) if order.driver_id else None
            if not driver:
                raise ConflictError("No driver assigned to this order")
            if not driver.phone:
                raise ConflictError("Assigned driver has no phone number")

            wa_now = datetime.now(timezone.utc)
            DriverSlipPdfService.ensure(db, order)

            row = MessageDeliveryService.initiate_whatsapp_slip(
                db, order, driver, triggered_by_user_id=actor.id,
            )

            # Mirror the email path's dispatch semantics: first handoff moves draft → dispatched.
            if order.delivery_status == "draft":
                order.delivery_status = "dispatched"
                order.dispatched_at = wa_now

            AuditService.log(
                db, actor, "orders", str(order.id), "update",
                None,
                {"whatsapp_initiated": True, "delivery_id": str(row.id), "delivery_status": order.delivery_status},
                request,
            )
            db.commit()
            db.refresh(order)

            background_tasks.add_task(
                _notify_admins, "order.documents_sent",
                f"WhatsApp slip dispatched · {order.order_number}",
                f"To driver {driver.full_name}", f"/admin/orders/{order.id}",
                {"order_number": order.order_number, "channel": "whatsapp", "to": "driver"},
                actor.id,
            )

            resp = CourierOrderResponse.model_validate(order)
            resp.whatsapp_link = row.deep_link
            return resp

        now = datetime.now(timezone.utc)
        queued: list[int] = []

        if "driver" in payload.to:
            driver = db.get(Driver, order.driver_id) if order.driver_id else None
            if not driver:
                raise ConflictError("No driver assigned to this order")
            if not driver.email:
                raise ConflictError("Assigned driver has no email address")
            # Always render the slip fresh so the emailed PDF reflects the order's current state.
            try:
                order.driver_slip_pdf_url = DriverSlipPdfService.render(db, order)
            except Exception as e:
                db.rollback()
                logger.error(f"Error rendering driver slip PDF for order {order.order_number}: {e}")
                raise AppError("Failed to generate the driver slip PDF")
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
                attachment_path=str(Path(order.driver_slip_pdf_url).resolve()),
                attachment_name=f"{order.order_number}.pdf",
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
                attachment_path=str(Path(order.invoice.pdf_url).resolve()) if order.invoice.pdf_url else None,
                attachment_name=f"{order.invoice.invoice_number}.pdf",
            )
            queued.append(log.id)

        if not queued:
            raise ConflictError("Nothing to send (use to=['driver'] and/or ['customer'])")

        AuditService.log(db, actor, "orders", str(order.id), "update",
                         None, {"sent": payload.to, "delivery_status": order.delivery_status}, request)
        db.commit()
        db.refresh(order)
        background_tasks.add_task(_dispatch_emails, queued)
        recipients = " & ".join(payload.to)
        background_tasks.add_task(
            _notify_admins, "order.documents_sent",
            f"Email sent · {order.order_number}", f"To: {recipients}",
            f"/admin/orders/{order.id}",
            {"order_number": order.order_number, "channel": "email", "to": payload.to},
            actor.id,
        )
        return CourierOrderResponse.model_validate(order)
