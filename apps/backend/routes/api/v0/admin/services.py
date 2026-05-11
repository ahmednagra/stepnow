# apps/backend/routes/api/v0/admin/services.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.ServicesController import ServicesController
from app.Models.admin import AdminUser
from app.Schemas.admin.services import ServiceAdminResponse, ServiceCreate, ServiceUpdate
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/services", tags=["admin: services"])


@router.get("", response_model=PaginatedResponse[ServiceAdminResponse])
async def list_services(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    include_inactive: bool = Query(True),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[ServiceAdminResponse]:
    return ServicesController.list_services(db, page, size, q, include_inactive, include_deleted)


@router.get("/{service_id}", response_model=ServiceAdminResponse)
async def get_service(service_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ServiceAdminResponse:
    return ServicesController.get(db, service_id)


@router.post("", response_model=ServiceAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_service(request: Request, payload: ServiceCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ServiceAdminResponse:
    return ServicesController.create(db, payload, actor, request)


@router.patch("/{service_id}", response_model=ServiceAdminResponse)
async def update_service(request: Request, service_id: UUID, payload: ServiceUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ServiceAdminResponse:
    return ServicesController.update(db, service_id, payload, actor, request)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(request: Request, service_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    ServicesController.delete(db, service_id, actor, request)


@router.post("/{service_id}/restore", response_model=ServiceAdminResponse)
async def restore_service(request: Request, service_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> ServiceAdminResponse:
    return ServicesController.restore(db, service_id, actor, request)
