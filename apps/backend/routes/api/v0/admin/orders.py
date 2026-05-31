# apps/backend/routes/api/v0/admin/orders.py
# Order lifecycle endpoints: convert booking → order, manage orders, optional invoice,
# payments ledger. Register AFTER admin_forms_router in routes/__init__.py.

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.OrdersController import OrdersController
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
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
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: orders"])


# ── Convert a booking into an order ──
@router.post("/admin/bookings/{booking_id}/convert-to-order", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def convert_booking(request: Request, booking_id: UUID, payload: OrderCreateFromBooking, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.convert_from_booking(db, booking_id, payload, actor, request)


# ── Orders ──
@router.get("/admin/orders", response_model=PaginatedResponse[OrderAdminResponse])
async def list_orders(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, max_length=20),
    q: str | None = Query(None, max_length=200),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[OrderAdminResponse]:
    return OrdersController.list(db, page, size, status, q, include_deleted)


@router.get("/admin/orders/{order_id}", response_model=OrderDetailResponse)
async def get_order(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.get(db, order_id)


@router.patch("/admin/orders/{order_id}", response_model=OrderDetailResponse)
async def update_order(request: Request, order_id: UUID, payload: OrderStatusUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.update(db, order_id, payload, actor, request)


@router.delete("/admin/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(request: Request, order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    OrdersController.delete(db, order_id, actor, request)


# ── Optional billing ──
@router.post("/admin/orders/{order_id}/invoice", response_model=InvoiceAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(request: Request, order_id: UUID, payload: InvoiceCreateFromOrder, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.create_invoice(db, order_id, payload, actor, request)


# ── Payments ──
@router.get("/admin/orders/{order_id}/payments", response_model=list[PaymentResponse])
async def list_payments(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> list[PaymentResponse]:
    return OrdersController.list_payments(db, order_id)


@router.post("/admin/orders/{order_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(request: Request, order_id: UUID, payload: PaymentCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PaymentResponse:
    return OrdersController.record_payment(db, order_id, payload, actor, request)
