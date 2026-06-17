# apps/backend/app/Http/Controllers/admin/VehiclesController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.vehicles import VehicleAdminResponse, VehicleCreate, VehicleUpdate
from app.Schemas.common import PaginatedResponse
from app.Services.VehiclesService import VehiclesService


class VehiclesController:

    @staticmethod
    def list_vehicles(db: Session, page: int, size: int, q: str | None, category: str | None, include_inactive: bool, include_deleted: bool) -> PaginatedResponse[VehicleAdminResponse]:
        items, total = VehiclesService.list_vehicles(db, page, size, q, category, include_inactive, include_deleted)
        return PaginatedResponse[VehicleAdminResponse].build(
            [VehicleAdminResponse.model_validate(v) for v in items], page, size, total
        )

    @staticmethod
    def get(db: Session, vehicle_id: UUID) -> VehicleAdminResponse:
        v = VehiclesService.get_vehicle(db, vehicle_id, allow_deleted=True)
        return VehicleAdminResponse.model_validate(v)

    @staticmethod
    def create(db: Session, payload: VehicleCreate, actor: AdminUser, request: Request) -> VehicleAdminResponse:
        v = VehiclesService.create_vehicle(db, payload.model_dump(), actor, request)
        return VehicleAdminResponse.model_validate(v)

    @staticmethod
    def update(db: Session, vehicle_id: UUID, payload: VehicleUpdate, actor: AdminUser, request: Request) -> VehicleAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        v = VehiclesService.update_vehicle(db, vehicle_id, data, actor, request)
        return VehicleAdminResponse.model_validate(v)

    @staticmethod
    def delete(db: Session, vehicle_id: UUID, actor: AdminUser, request: Request) -> None:
        VehiclesService.soft_delete_vehicle(db, vehicle_id, actor, request)

    @staticmethod
    def restore(db: Session, vehicle_id: UUID, actor: AdminUser, request: Request) -> VehicleAdminResponse:
        v = VehiclesService.restore_vehicle(db, vehicle_id, actor, request)
        return VehicleAdminResponse.model_validate(v)
