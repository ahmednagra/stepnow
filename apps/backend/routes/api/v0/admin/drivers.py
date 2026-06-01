# apps/backend/routes/api/v0/admin/drivers.py 

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.DriversController import DriversController
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.drivers_admin import DriverCreate, DriverResponse, DriverUpdate
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: drivers"])


@router.get("/admin/drivers", response_model=PaginatedResponse[DriverResponse])
async def list_drivers(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    active_only: bool = Query(False),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[DriverResponse]:
    return DriversController.list(db, page, size, q, active_only, include_deleted)


@router.post(
    "/admin/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED
)
async def create_driver(
    request: Request,
    payload: DriverCreate,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> DriverResponse:
    return DriversController.create(db, payload, actor, request)


@router.get("/admin/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: UUID,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> DriverResponse:
    return DriversController.get(db, driver_id)


@router.patch("/admin/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(
    request: Request,
    driver_id: UUID,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> DriverResponse:
    return DriversController.update(db, driver_id, payload, actor, request)


@router.delete("/admin/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    request: Request,
    driver_id: UUID,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> None:
    DriversController.delete(db, driver_id, actor, request)


@router.get(
    "/admin/drivers/{driver_id}/orders", response_model=list[CourierOrderResponse]
)
async def driver_orders(
    driver_id: UUID,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> list[CourierOrderResponse]:
    return DriversController.list_orders(db, driver_id)
