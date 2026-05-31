# apps/backend/app/Http/Controllers/admin/OrdersController.py
# Thin controller for the whole order bounded context (orders + optional invoices + payments),
# mirroring how PricingController covers categories+items. Returns response models; all
# business logic lives in the services.

import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
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


class OrdersController:

    # ── Orders ──────────────────────────────────────────────
    @staticmethod
    def convert_from_booking(db: Session, booking_id: UUID, payload: OrderCreateFromBooking, actor: AdminUser, request: Request) -> OrderDetailResponse:
        order = OrdersService.create_from_booking(db, booking_id, payload, actor, request)
        return OrdersController._detail(db, order)

    @staticmethod
    def list(db: Session, page: int, size: int, status: str | None, q: str | None, include_deleted: bool) -> PaginatedResponse[OrderAdminResponse]:
        items, total = OrdersService.list(db, page, size, status, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[OrderAdminResponse](
            items=[OrderAdminResponse.model_validate(o) for o in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, order_id: UUID) -> OrderDetailResponse:
        return OrdersController._detail(db, OrdersService.get(db, order_id))

    @staticmethod
    def update(db: Session, order_id: UUID, payload: OrderStatusUpdate, actor: AdminUser, request: Request) -> OrderDetailResponse:
        order = OrdersService.update(db, order_id, payload.model_dump(exclude_unset=True), actor, request)
        return OrdersController._detail(db, order)

    @staticmethod
    def delete(db: Session, order_id: UUID, actor: AdminUser, request: Request) -> None:
        OrdersService.soft_delete(db, order_id, actor, request)

    # ── Invoice (optional billing) ──────────────────────────
    @staticmethod
    def create_invoice(db: Session, order_id: UUID, payload: InvoiceCreateFromOrder, actor: AdminUser, request: Request) -> InvoiceAdminResponse:
        invoice = InvoicesService.create_from_order(db, order_id, payload, actor, request)
        return InvoiceAdminResponse.model_validate(invoice)

    # ── Payments ────────────────────────────────────────────
    @staticmethod
    def record_payment(db: Session, order_id: UUID, payload: PaymentCreate, actor: AdminUser, request: Request) -> PaymentResponse:
        payment = PaymentsService.record(db, order_id, payload, actor, request)
        return PaymentResponse.model_validate(payment)

    @staticmethod
    def list_payments(db: Session, order_id: UUID) -> list[PaymentResponse]:
        return [PaymentResponse.model_validate(p) for p in PaymentsService.list_for_order(db, order_id)]

    # ── helper: assemble the detail response with derived amounts ──
    @staticmethod
    def _detail(db: Session, order) -> OrderDetailResponse:
        paid = PaymentsService.received_total(db, order.id)
        balance = PaymentsService.balance_due(db, order)
        payments = [PaymentResponse.model_validate(p) for p in PaymentsService.list_for_order(db, order.id)]
        invoice = InvoiceAdminResponse.model_validate(order.invoice) if order.invoice else None
        base = OrderAdminResponse.model_validate(order).model_dump()
        return OrderDetailResponse(**base, invoice=invoice, payments=payments, amount_paid=paid, balance_due=balance)
