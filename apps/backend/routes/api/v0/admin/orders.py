# apps/backend/routes/api/v0/admin/orders.py
# Order lifecycle endpoints: convert booking → order, manage orders, optional invoice,
# payments ledger. Register AFTER admin_forms_router in routes/__init__.py.
#
# Mutating endpoints accept BackgroundTasks so the controller can schedule post-commit,
# best-effort WebSocket fan-out + admin notifications without blocking the response.

from uuid import UUID
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.OrdersController import OrdersController
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
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: orders"])


# ── Convert a booking into an order ──
@router.post("/admin/bookings/{booking_id}/convert-to-order", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def convert_booking(request: Request, booking_id: UUID, payload: OrderCreateFromBooking, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.convert_from_booking(db, booking_id, payload, actor, request, background_tasks)


# ── Orders ──
@router.get("/admin/orders", response_model=PaginatedResponse[OrderAdminResponse])
def list_orders(
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
def get_order(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.get(db, order_id)


@router.patch("/admin/orders/{order_id}", response_model=OrderDetailResponse)
def update_order(request: Request, order_id: UUID, payload: OrderStatusUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> OrderDetailResponse:
    return OrdersController.update(db, order_id, payload, actor, request, background_tasks)


@router.delete("/admin/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(request: Request, order_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    OrdersController.delete(db, order_id, actor, request, background_tasks)


# ── Optional billing ──
@router.post("/admin/orders/{order_id}/invoice", response_model=InvoiceAdminResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(request: Request, order_id: UUID, payload: InvoiceCreateFromOrder, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.create_invoice(db, order_id, payload, actor, request, background_tasks)


# ── Bills (invoices) — list, edit, PDF. The vehicle account is unaffected by edits here. ──
@router.get("/admin/invoices", response_model=PaginatedResponse[InvoiceListResponse])
def list_invoices(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, max_length=20),
    q: str | None = Query(None, max_length=200),
) -> PaginatedResponse[InvoiceListResponse]:
    return OrdersController.list_invoices(db, page, size, status, q)


@router.get("/admin/invoices/{invoice_id}", response_model=InvoiceAdminResponse)
def get_invoice(invoice_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.get_invoice(db, invoice_id)


@router.patch("/admin/invoices/{invoice_id}", response_model=InvoiceAdminResponse)
def update_invoice(request: Request, invoice_id: UUID, payload: InvoiceUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.update_invoice(db, invoice_id, payload, actor, request)


@router.post("/admin/invoices/{invoice_id}/issue", response_model=InvoiceAdminResponse)
def issue_invoice(request: Request, invoice_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.issue_invoice(db, invoice_id, actor, request)


@router.post("/admin/invoices/{invoice_id}/cancel", response_model=InvoiceAdminResponse)
def cancel_invoice(request: Request, invoice_id: UUID, payload: InvoiceCancel | None = None, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> InvoiceAdminResponse:
    return OrdersController.cancel_invoice(db, invoice_id, payload, actor, request)


@router.get("/admin/invoices/{invoice_id}/pdf")
def invoice_pdf_by_id(invoice_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FileResponse:
    path = OrdersController.invoice_pdf_path_by_id(db, invoice_id)
    return FileResponse(path, media_type="application/pdf", filename=Path(path).name)


@router.get("/admin/invoices/{invoice_id}/storno/pdf")
def storno_pdf_by_id(invoice_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FileResponse:
    path = OrdersController.storno_pdf_path_by_id(db, invoice_id)
    return FileResponse(path, media_type="application/pdf", filename=Path(path).name)


# ── Payments ──
@router.get("/admin/orders/{order_id}/payments", response_model=list[PaymentResponse])
def list_payments(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> list[PaymentResponse]:
    return OrdersController.list_payments(db, order_id)


@router.post("/admin/orders/{order_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(request: Request, order_id: UUID, payload: PaymentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PaymentResponse:
    return OrdersController.record_payment(db, order_id, payload, actor, request, background_tasks)


@router.patch("/admin/payments/{payment_id}", response_model=PaymentResponse)
def set_payment_status(request: Request, payment_id: UUID, payload: PaymentStatusUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PaymentResponse:
    return OrdersController.set_payment_status(db, payment_id, payload, actor, request, background_tasks)


# ── Invoice PDF (authenticated stream — invoices hold personal data) ──
@router.get("/admin/orders/{order_id}/invoice/pdf")
def invoice_pdf(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FileResponse:
    path = OrdersController.invoice_pdf_path(db, order_id)
    return FileResponse(path, media_type="application/pdf", filename=Path(path).name)
