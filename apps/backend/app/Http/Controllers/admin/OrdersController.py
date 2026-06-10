# apps/backend/app/Http/Controllers/admin/OrdersController.py
# Thin controller for the orders + optional-billing module. Logic lives in the services.
# Realtime + notifications are fired POST-COMMIT via BackgroundTasks (best-effort): the service
# owns the transaction and commits; the controller then schedules a WS fan-out to the admin
# operations feed + the per-order channel, and an in-app notification to all admins. A failed
# emit is logged inside the subsystem and never affects the HTTP response.

import math
from datetime import date
from pathlib import Path
from uuid import UUID
from fastapi import BackgroundTasks, Request
from sqlalchemy.orm import Session
from config.database import SessionLocal
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.admin.orders_admin import (
    InvoiceAdminResponse,
    InvoiceCreateFromOrder,
    OrderAdminResponse,
    OrderCreateFromBooking,
    OrderDetailResponse,
    OrderStatusUpdate,
    PaymentCreate,
    PaymentResponse,
)
from app.Services.OrdersService import OrdersService
from app.Services.InvoicesService import InvoicesService
from app.Services.PaymentsService import PaymentsService
from app.Services.InvoicePdfService import InvoicePdfService
from app.Services.Notifications import NotificationService
from app.WebSocket.events.orders import OrderEvent, dispatch_order_event


# ── Post-commit side-effects (run on BackgroundTasks, never block the response) ──
def _emit_order_event(event_type: str, order_id: str, data: dict, actor_id: str | None) -> None:
    # WebSocket fan-out (admin feed + order:{id}). Best-effort; swallows its own errors.
    dispatch_order_event(event_type, order_id, data, actor_id)


def _notify_admins(type_code: str, title: str, body: str | None, link: str, data: dict, actor_id: UUID | None) -> None:
    # In-app notification to every active admin (excludes the actor who triggered it). Opens its
    # own session, mirroring CourierController._dispatch_emails. Owns its commit.
    db = SessionLocal()
    try:
        NotificationService.notify_all_admins(
            db, type_code, title, body=body, link=link, data=data, exclude_id=actor_id
        )
        db.commit()
    finally:
        db.close()


class OrdersController:
    # ── Orders ──────────────────────────────────────────────
    @staticmethod
    def convert_from_booking(
        db: Session,
        booking_id: UUID,
        payload: OrderCreateFromBooking,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> OrderDetailResponse:
        order = OrdersService.create_from_booking(
            db, booking_id, payload, actor, request
        )
        data = {"order_number": order.order_number, "customer_name": order.customer_name}
        link = f"/admin/orders/{order.id}"
        background_tasks.add_task(_emit_order_event, OrderEvent.CREATED, str(order.id), data, str(actor.id))
        background_tasks.add_task(
            _notify_admins, "order.created",
            f"New order {order.order_number}", order.customer_name, link, data, actor.id,
        )
        return OrdersController._detail(db, order)

    @staticmethod
    def list(
        db: Session,
        page: int,
        size: int,
        status: str | None,
        q: str | None,
        include_deleted: bool,
    ) -> PaginatedResponse[OrderAdminResponse]:
        items, total = OrdersService.list(db, page, size, status, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        today = date.today()
        rows: list[OrderAdminResponse] = []
        for o in items:
            # Derive payment + invoice state per row so the list view can show balance/overdue
            # without a round-trip to the detail endpoint. Same PaymentsService calls used in
            # _detail; the page size cap (≤100) keeps this cheap.
            paid = PaymentsService.received_total(db, o.id)
            balance = PaymentsService.balance_due(db, o)
            invoice = o.invoice  # one-to-one relationship (may be None)
            is_overdue = bool(
                balance > 0 and o.due_date is not None and o.due_date < today
            )
            base = OrderAdminResponse.model_validate(o).model_dump()
            base.update(
                amount_paid=paid,
                balance_due=balance,
                is_overdue=is_overdue,
                invoice_number=invoice.invoice_number if invoice else None,
                invoice_status=invoice.status if invoice else None,
            )
            rows.append(OrderAdminResponse(**base))
        return PaginatedResponse[OrderAdminResponse](
            items=rows,
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, order_id: UUID) -> OrderDetailResponse:
        return OrdersController._detail(db, OrdersService.get(db, order_id))

    @staticmethod
    def update(
        db: Session,
        order_id: UUID,
        payload: OrderStatusUpdate,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> OrderDetailResponse:
        order = OrdersService.update(
            db, order_id, payload.model_dump(exclude_unset=True), actor, request
        )
        data = {"order_number": order.order_number, "status": order.status}
        link = f"/admin/orders/{order.id}"
        background_tasks.add_task(_emit_order_event, OrderEvent.UPDATED, str(order.id), data, str(actor.id))
        background_tasks.add_task(
            _notify_admins, "order.updated",
            f"Order {order.order_number} updated", f"Status: {order.status}", link, data, actor.id,
        )
        return OrdersController._detail(db, order)

    @staticmethod
    def delete(
        db: Session,
        order_id: UUID,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> None:
        order = OrdersService.get(db, order_id)
        order_number = order.order_number
        OrdersService.soft_delete(db, order_id, actor, request)
        data = {"order_number": order_number}
        background_tasks.add_task(_emit_order_event, OrderEvent.DELETED, str(order_id), data, str(actor.id))
        background_tasks.add_task(
            _notify_admins, "order.deleted",
            f"Order {order_number} deleted", None, "/admin/orders", data, actor.id,
        )

    # ── Invoice (optional billing) ──────────────────────────
    @staticmethod
    def create_invoice(
        db: Session,
        order_id: UUID,
        payload: InvoiceCreateFromOrder,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> InvoiceAdminResponse:
        invoice = InvoicesService.create_from_order(
            db, order_id, payload, actor, request
        )
        # Render the PDF immediately and store its (non-public) path.
        invoice.pdf_url = InvoicePdfService.render(db, invoice)
        db.commit()
        db.refresh(invoice)
        data = {"invoice_number": invoice.invoice_number, "order_id": str(order_id)}
        link = f"/admin/orders/{order_id}"
        background_tasks.add_task(_emit_order_event, OrderEvent.INVOICE_CREATED, str(order_id), data, str(actor.id))
        background_tasks.add_task(
            _notify_admins, "order.invoice_created",
            f"Invoice {invoice.invoice_number} created", None, link, data, actor.id,
        )
        return InvoiceAdminResponse.model_validate(invoice)

    @staticmethod
    def invoice_pdf_path(db: Session, order_id: UUID) -> str:
        """Absolute path to the invoice PDF for this order — (re)generates if missing."""
        order = OrdersService.get(db, order_id)
        inv = order.invoice
        if not inv:
            raise NotFoundError("Order has no invoice", order_id=str(order_id))
        path = inv.pdf_url
        if not path or not Path(path).exists():
            inv.pdf_url = InvoicePdfService.render(db, inv)
            db.commit()
            db.refresh(inv)
            path = inv.pdf_url
        return str(Path(path).resolve())

    # ── Payments ────────────────────────────────────────────
    @staticmethod
    def record_payment(
        db: Session,
        order_id: UUID,
        payload: PaymentCreate,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> PaymentResponse:
        payment = PaymentsService.record(db, order_id, payload, actor, request)
        data = {"order_id": str(order_id), "amount": str(payment.amount)}
        link = f"/admin/orders/{order_id}"
        background_tasks.add_task(_emit_order_event, OrderEvent.PAYMENT_RECORDED, str(order_id), data, str(actor.id))
        background_tasks.add_task(
            _notify_admins, "order.payment_recorded",
            f"Payment recorded ({payment.amount})", None, link, data, actor.id,
        )
        return PaymentResponse.model_validate(payment)

    @staticmethod
    def list_payments(db: Session, order_id: UUID):
        return [
            PaymentResponse.model_validate(p)
            for p in PaymentsService.list_for_order(db, order_id)
        ]

    # ── helper: assemble the detail response with derived amounts ──
    @staticmethod
    def _detail(db: Session, order) -> OrderDetailResponse:
        paid = PaymentsService.received_total(db, order.id)
        balance = PaymentsService.balance_due(db, order)
        payments = [
            PaymentResponse.model_validate(p)
            for p in PaymentsService.list_for_order(db, order.id)
        ]
        invoice = (
            InvoiceAdminResponse.model_validate(order.invoice)
            if order.invoice
            else None
        )
        today = date.today()
        is_overdue = bool(
            balance > 0 and order.due_date is not None and order.due_date < today
        )
        base = OrderAdminResponse.model_validate(order).model_dump()
        # Keep the detail response's derived fields consistent with the list view.
        base.update(
            amount_paid=paid,
            balance_due=balance,
            is_overdue=is_overdue,
            invoice_number=order.invoice.invoice_number if order.invoice else None,
            invoice_status=order.invoice.status if order.invoice else None,
        )
        return OrderDetailResponse(
            **base,
            invoice=invoice,
            payments=payments,
        )
