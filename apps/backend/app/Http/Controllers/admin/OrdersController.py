# apps/backend/app/Http/Controllers/admin/OrdersController.py
# Thin controller for the orders + optional-billing module. Logic lives in the services.
# Realtime + notifications are fired POST-COMMIT via BackgroundTasks (best-effort): the service
# owns the transaction and commits; the controller then schedules a WS fan-out to the admin
# operations feed + the per-order channel, and an in-app notification to all admins. A failed
# emit is logged inside the subsystem and never affects the HTTP response.

from datetime import date
from pathlib import Path
from uuid import UUID
from fastapi import BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import AppError, NotFoundError
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.orders_admin import (
    InvoiceAdminResponse,
    InvoiceCancel,
    InvoiceCreateFromOrder,
    InvoiceListResponse,
    InvoiceUpdate,
    OrderAdminResponse,
    OrderCreateFromBooking,
    OrderDetailResponse,
    OrderStatusUpdate,
    PaymentCreate,
    PaymentResponse,
    PaymentStatusUpdate,
)
from app.Services.OrdersService import OrdersService
from app.Services.InvoicesService import InvoicesService
from app.Services.PaymentsService import PaymentsService
from app.Services.InvoicePdfService import InvoicePdfService
from app.Http.Controllers._background import notify_admins as _notify_admins
from app.Utils.finance import money
from app.Utils.Logger import get_logger
from app.WebSocket.events.orders import OrderEvent, dispatch_order_event

logger = get_logger("orders_controller")


# ── Post-commit side-effects (run on BackgroundTasks, never block the response) ──
def _emit_order_event(event_type: str, order_id: str, data: dict, actor_id: str | None) -> None:
    # WebSocket fan-out (admin feed + order:{id}). Best-effort; swallows its own errors.
    dispatch_order_event(event_type, order_id, data, actor_id)


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
        today = date.today()
        # One grouped SUM for the whole page + invoices eager-loaded in OrdersService.list,
        # so the per-row derivation below issues NO queries (was 3 SUMs + 1 lazy-load per row).
        paid_map = PaymentsService.totals_for(db, [o.id for o in items])
        rows: list[OrderAdminResponse] = []
        for o in items:
            base = OrderAdminResponse.model_validate(o).model_dump()
            base.update(OrdersController._derived(o, paid_map.get(o.id, money(0)), today))
            rows.append(OrderAdminResponse(**base))
        return PaginatedResponse[OrderAdminResponse].build(rows, page, size, total)

    @staticmethod
    def get(db: Session, order_id: UUID) -> OrderDetailResponse:
        # History view: a soft-deleted order stays readable (it may carry issued Belege).
        return OrdersController._detail(db, OrdersService.get(db, order_id, allow_deleted=True))

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
        inv = OrdersService.get(db, order_id).current_invoice
        if not inv:
            raise NotFoundError("Order has no invoice", order_id=str(order_id))
        return OrdersController._pdf_path(db, inv)

    @staticmethod
    def _pdf_path(db: Session, inv) -> str:
        """A draft renders from current data on every download. An issued/paid/cancelled bill serves
        ONLY the file frozen at issue — regenerating it would print today's settings on a Beleg."""
        if inv.status == "draft":
            try:
                return str(Path(InvoicePdfService.render(db, inv)).resolve())
            except Exception as e:
                logger.error(f"Error rendering draft invoice PDF {inv.invoice_number}: {e}")
                raise AppError("Failed to generate the invoice PDF")
        if not inv.pdf_url or not Path(inv.pdf_url).exists():
            logger.error(f"Frozen invoice PDF missing for {inv.invoice_number}: {inv.pdf_url}")
            raise NotFoundError(
                f"The issued PDF of invoice {inv.invoice_number} is missing from storage. An issued invoice is "
                "never regenerated from current data — restore the file from backup.",
                invoice_id=str(inv.id),
            )
        return str(Path(inv.pdf_url).resolve())

    # ── Bills (invoices): list · get · edit · PDF. Edits never touch order amounts. ──
    @staticmethod
    def list_invoices(db: Session, page: int, size: int, status: str | None, q: str | None) -> PaginatedResponse[InvoiceListResponse]:
        items, total = InvoicesService.list_invoices(db, page, size, status, q)
        today = date.today()
        paid_map = PaymentsService.invoice_totals_for(db, [inv.id for inv in items])
        rows = []
        for inv in items:
            o = inv.order
            paid = paid_map.get(inv.id, money(0))
            # A cancelled bill owes nothing (its credit moved to the order); only an issued one can be overdue.
            balance = money(0) if inv.status == "cancelled" else money(inv.gross_amount - paid)
            rows.append(InvoiceListResponse(
                id=inv.id, invoice_number=inv.invoice_number, order_id=inv.order_id,
                order_number=o.order_number, status=inv.status, issue_date=inv.issue_date,
                due_date=inv.due_date, customer_name=o.customer_name,
                route_from=o.pickup_city or o.pickup_address, route_to=o.destination_city or o.destination_address,
                gross_amount=inv.gross_amount, amount_paid=paid, balance_due=balance,
                is_overdue=bool(inv.status == "issued" and balance > 0 and inv.due_date is not None and inv.due_date < today),
            ))
        return PaginatedResponse[InvoiceListResponse].build(rows, page, size, total)

    @staticmethod
    def get_invoice(db: Session, invoice_id: UUID) -> InvoiceAdminResponse:
        return InvoiceAdminResponse.model_validate(InvoicesService.get(db, invoice_id))

    @staticmethod
    def update_invoice(db: Session, invoice_id: UUID, payload: InvoiceUpdate, actor: AdminUser, request: Request) -> InvoiceAdminResponse:
        return InvoiceAdminResponse.model_validate(InvoicesService.update(db, invoice_id, payload, actor, request))

    @staticmethod
    def issue_invoice(db: Session, invoice_id: UUID, actor: AdminUser, request: Request) -> InvoiceAdminResponse:
        return InvoiceAdminResponse.model_validate(InvoicesService.issue(db, invoice_id, actor, request))

    @staticmethod
    def cancel_invoice(db: Session, invoice_id: UUID, payload: InvoiceCancel, actor: AdminUser, request: Request) -> InvoiceAdminResponse:
        return InvoiceAdminResponse.model_validate(
            InvoicesService.cancel(db, invoice_id, actor, request, payload.reason if payload else None)
        )

    @staticmethod
    def invoice_pdf_path_by_id(db: Session, invoice_id: UUID) -> str:
        return OrdersController._pdf_path(db, InvoicesService.get(db, invoice_id))

    @staticmethod
    def storno_pdf_path_by_id(db: Session, invoice_id: UUID) -> str:
        """The Stornorechnung frozen at cancel() — served as-is, never re-rendered."""
        inv = InvoicesService.get(db, invoice_id)
        if inv.status != "cancelled":
            raise NotFoundError("Only a cancelled invoice has a Stornorechnung", invoice_id=str(invoice_id))
        if not inv.storno_pdf_url or not Path(inv.storno_pdf_url).exists():
            logger.error(f"Frozen Storno PDF missing for {inv.invoice_number}: {inv.storno_pdf_url}")
            raise NotFoundError(
                f"The Stornorechnung of invoice {inv.invoice_number} is missing from storage — restore the file from backup.",
                invoice_id=str(invoice_id),
            )
        return str(Path(inv.storno_pdf_url).resolve())

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
    def set_payment_status(
        db: Session,
        payment_id: UUID,
        payload: PaymentStatusUpdate,
        actor: AdminUser,
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> PaymentResponse:
        payment = PaymentsService.set_status(db, payment_id, payload.status, actor, request)
        data = {"payment_id": str(payment.id), "status": payment.status, "amount": str(payment.amount)}
        background_tasks.add_task(_emit_order_event, OrderEvent.UPDATED, str(payment.order_id), data, str(actor.id))
        return PaymentResponse.model_validate(payment)

    @staticmethod
    def list_payments(db: Session, order_id: UUID):
        return [
            PaymentResponse.model_validate(p)
            for p in PaymentsService.list_for_order(db, order_id)
        ]

    # ── helpers: derived amounts, shared by the list and detail views ──
    @staticmethod
    def _derived(order, paid, today: date) -> dict:
        inv = order.current_invoice
        balance = money(PaymentsService.billed_gross(order) - paid)
        # Billed jobs fall due on the invoice's date, and only once issued; unbilled ones on the order's.
        due = inv.due_date if inv else order.due_date
        return {
            "amount_paid": paid,
            "balance_due": balance,
            "is_overdue": bool(
                balance > 0 and order.status != "cancelled" and (inv is None or inv.status == "issued")
                and due is not None and due < today
            ),
            "invoice_number": inv.invoice_number if inv else None,
            "invoice_status": inv.status if inv else None,
        }

    @staticmethod
    def _detail(db: Session, order) -> OrderDetailResponse:
        inv = order.current_invoice
        base = OrderAdminResponse.model_validate(order).model_dump()
        base.update(OrdersController._derived(order, PaymentsService.received_total(db, order.id), date.today()))
        return OrderDetailResponse(
            **base,
            invoice=InvoiceAdminResponse.model_validate(inv) if inv else None,
            invoices=[InvoiceAdminResponse.model_validate(i) for i in order.invoices if not i.is_deleted],
            payments=[PaymentResponse.model_validate(p) for p in PaymentsService.list_for_order(db, order.id)],
        )
