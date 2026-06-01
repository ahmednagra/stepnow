# apps/backend/routes/api/v0/admin/courier.py

from uuid import UUID
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.CourierController import CourierController
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.courier_admin import (
    CourierOrderResponse, DeliveryStatusUpdate, ParcelOrderCreate, SendSlipRequest,
)
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: courier"])


@router.post("/admin/parcel-orders", response_model=CourierOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_parcel_order(request: Request, payload: ParcelOrderCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CourierOrderResponse:
    return CourierController.create(db, payload, actor, request)


@router.get("/admin/parcel-orders", response_model=PaginatedResponse[CourierOrderResponse])
async def list_parcel_orders(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    delivery_status: str | None = Query(None, max_length=20),
    q: str | None = Query(None, max_length=200),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[CourierOrderResponse]:
    return CourierController.list(db, page, size, delivery_status, q, include_deleted)


@router.patch("/admin/orders/{order_id}/parcel", response_model=CourierOrderResponse)
async def update_parcel_order(request: Request, order_id: UUID, payload: ParcelOrderCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CourierOrderResponse:
    return CourierController.update(db, order_id, payload, actor, request)


@router.post("/admin/orders/{order_id}/delivery-status", response_model=CourierOrderResponse)
async def set_delivery_status(request: Request, order_id: UUID, payload: DeliveryStatusUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CourierOrderResponse:
    return CourierController.set_delivery_status(db, order_id, payload, actor, request)


@router.get("/admin/orders/{order_id}/slip/pdf")
async def slip_pdf(order_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FileResponse:
    path = CourierController.slip_pdf_path(db, order_id)
    return FileResponse(path, media_type="application/pdf", filename=Path(path).name)


@router.post("/admin/orders/{order_id}/send", response_model=CourierOrderResponse)
async def send_documents(request: Request, order_id: UUID, payload: SendSlipRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CourierOrderResponse:
    return CourierController.send(db, order_id, payload, actor, request, background_tasks)
