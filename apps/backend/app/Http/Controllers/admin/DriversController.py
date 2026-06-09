# apps/backend/app/Http/Controllers/admin/DriversController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.admin.drivers_admin import (
    DriverCreate, DriverResponse, DriverUpdate, LicenseCheckCreate,
)
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Services.DriversService import DriversService


class DriversController:
    @staticmethod
    def _enrich(db: Session, d, aggregates: dict | None = None) -> DriverResponse:
        agg = (aggregates or {}).get(d.id, {})
        base = DriverResponse.model_validate(d).model_dump()
        base.update(
            compliance_status=DriversService.compliance_status(d),
            orders_count=agg.get("orders_count", 0),
            last_dispatch_at=agg.get("last_dispatch_at"),
        )
        return DriverResponse(**base)

    @staticmethod
    def list(
        db: Session, page: int, size: int, q: str | None, active_only: bool, include_deleted: bool,
    ) -> PaginatedResponse[DriverResponse]:
        items, total = DriversService.driver_list(db, page, size, q, active_only, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        aggregates = DriversService.aggregates_for(db, [d.id for d in items])
        return PaginatedResponse[DriverResponse](
            items=[DriversController._enrich(db, d, aggregates) for d in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, driver_id: UUID) -> DriverResponse:
        d = DriversService.get(db, driver_id)
        return DriversController._enrich(db, d, DriversService.aggregates_for(db, [d.id]))

    @staticmethod
    def create(db: Session, payload: DriverCreate, actor: AdminUser, request: Request) -> DriverResponse:
        d = DriversService.create(db, payload.model_dump(), actor, request)
        return DriversController._enrich(db, d)

    @staticmethod
    def update(db: Session, driver_id: UUID, payload: DriverUpdate, actor: AdminUser, request: Request) -> DriverResponse:
        d = DriversService.update(db, driver_id, payload.model_dump(exclude_unset=True), actor, request)
        return DriversController._enrich(db, d, DriversService.aggregates_for(db, [d.id]))

    @staticmethod
    def record_license_check(db: Session, driver_id: UUID, payload: LicenseCheckCreate, actor: AdminUser, request: Request) -> DriverResponse:
        d = DriversService.record_license_check(
            db, driver_id, payload.checked_on, payload.interval_months, payload.notes, actor, request
        )
        return DriversController._enrich(db, d, DriversService.aggregates_for(db, [d.id]))

    @staticmethod
    def delete(db: Session, driver_id: UUID, actor: AdminUser, request: Request) -> None:
        DriversService.soft_delete(db, driver_id, actor, request)

    @staticmethod
    def list_orders(db: Session, driver_id: UUID):
        return [
            CourierOrderResponse.model_validate(o)
            for o in DriversService.list_orders(db, driver_id)
        ]
