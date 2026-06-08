# apps/backend/app/Http/Controllers/admin/OrdersController.py
# Thin controller for the orders + optional-billing module. Logic lives in the services.

import math
from datetime import date
from pathlib import Path
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
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


class OrdersController:
    # ── Orders ──────────────────────────────────────────────
    @staticmethod
    def convert_from_booking(
        db: Session,
        booking_id: UUID,
        payload: OrderCreateFromBooking,
        actor: AdminUser,
        request: Request,
    ) -> OrderDetailResponse:
        order = OrdersService.create_from_booking(
            db, booking_id, payload, actor, request
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
    ) -> OrderDetailResponse:
        order = OrdersService.update(
            db, order_id, payload.model_dump(exclude_unset=True), actor, request
        )
        return OrdersController._detail(db, order)

    @staticmethod
    def delete(db: Session, order_id: UUID, actor: AdminUser, request: Request) -> None:
        OrdersService.soft_delete(db, order_id, actor, request)

    # ── Invoice (optional billing) ──────────────────────────
    @staticmethod
    def create_invoice(
        db: Session,
        order_id: UUID,
        payload: InvoiceCreateFromOrder,
        actor: AdminUser,
        request: Request,
    ) -> InvoiceAdminResponse:
        invoice = InvoicesService.create_from_order(
            db, order_id, payload, actor, request
        )
        # Render the PDF immediately and store its (non-public) path.
        invoice.pdf_url = InvoicePdfService.render(db, invoice)
        db.commit()
        db.refresh(invoice)
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
    ) -> PaymentResponse:
        payment = PaymentsService.record(db, order_id, payload, actor, request)
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
