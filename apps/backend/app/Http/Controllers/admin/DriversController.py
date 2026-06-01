# apps/backend/app/Http/Controllers/admin/DriversController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.admin.drivers_admin import DriverCreate, DriverResponse, DriverUpdate
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Services.DriversService import DriversService


class DriversController:
    @staticmethod
    def list(
        db: Session,
        page: int,
        size: int,
        q: str | None,
        active_only: bool,
        include_deleted: bool,
    ) -> PaginatedResponse[DriverResponse]:
        items, total = DriversService.list(
            db, page, size, q, active_only, include_deleted
        )
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[DriverResponse](
            items=[DriverResponse.model_validate(d) for d in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, driver_id: UUID) -> DriverResponse:
        return DriverResponse.model_validate(DriversService.get(db, driver_id))

    @staticmethod
    def create(
        db: Session, payload: DriverCreate, actor: AdminUser, request: Request
    ) -> DriverResponse:
        return DriverResponse.model_validate(
            DriversService.create(db, payload.model_dump(), actor, request)
        )

    @staticmethod
    def update(
        db: Session,
        driver_id: UUID,
        payload: DriverUpdate,
        actor: AdminUser,
        request: Request,
    ) -> DriverResponse:
        return DriverResponse.model_validate(
            DriversService.update(
                db, driver_id, payload.model_dump(exclude_unset=True), actor, request
            )
        )

    @staticmethod
    def delete(
        db: Session, driver_id: UUID, actor: AdminUser, request: Request
    ) -> None:
        DriversService.soft_delete(db, driver_id, actor, request)

    @staticmethod
    def list_orders(db: Session, driver_id: UUID):
        return [
            CourierOrderResponse.model_validate(o)
            for o in DriversService.list_orders(db, driver_id)
        ]
