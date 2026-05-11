# apps/backend/routes/api/v0/admin/vehicles.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.VehiclesController import VehiclesController
from app.Models.admin import AdminUser
from app.Schemas.admin.vehicles import VehicleAdminResponse, VehicleCreate, VehicleUpdate
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/vehicles", tags=["admin: vehicles"])


@router.get("", response_model=PaginatedResponse[VehicleAdminResponse])
async def list_vehicles(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    category: str | None = Query(None, max_length=50),
    include_inactive: bool = Query(True),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[VehicleAdminResponse]:
    return VehiclesController.list_vehicles(db, page, size, q, category, include_inactive, include_deleted)


@router.get("/{vehicle_id}", response_model=VehicleAdminResponse)
async def get_vehicle(vehicle_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> VehicleAdminResponse:
    return VehiclesController.get(db, vehicle_id)


@router.post("", response_model=VehicleAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(request: Request, payload: VehicleCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> VehicleAdminResponse:
    return VehiclesController.create(db, payload, actor, request)


@router.patch("/{vehicle_id}", response_model=VehicleAdminResponse)
async def update_vehicle(request: Request, vehicle_id: UUID, payload: VehicleUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> VehicleAdminResponse:
    return VehiclesController.update(db, vehicle_id, payload, actor, request)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(request: Request, vehicle_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    VehiclesController.delete(db, vehicle_id, actor, request)


@router.post("/{vehicle_id}/restore", response_model=VehicleAdminResponse)
async def restore_vehicle(request: Request, vehicle_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> VehicleAdminResponse:
    return VehiclesController.restore(db, vehicle_id, actor, request)
