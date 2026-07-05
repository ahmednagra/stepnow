# apps/backend/app/Http/Controllers/admin/VehiclesController.py
from datetime import date
from pathlib import Path
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.vehicles import (
    VehicleAdminResponse, VehicleCreate, VehicleUpdate,
    VehicleLedgerOrder, VehicleLedgerResponse, VehicleLedgerTotals,
)
from app.Schemas.common import PaginatedResponse
from app.Services.VehiclesService import VehiclesService
from app.Services.VehicleLedgerPdfService import VehicleLedgerPdfService


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

    @staticmethod
    def ledger(db: Session, vehicle_id: UUID, date_from: date | None, date_to: date | None) -> VehicleLedgerResponse:
        vehicle, rows, totals = VehiclesService.get_ledger(db, vehicle_id, date_from, date_to)
        orders = [
            VehicleLedgerOrder(
                order_id=o.id, order_number=o.order_number,
                date=o.preferred_date or (o.scheduled_datetime.date() if o.scheduled_datetime else None),
                customer_name=o.customer_name,
                route_from=o.pickup_city or o.pickup_address,
                route_to=o.destination_city or o.destination_address,
                net_amount=o.net_amount, gross_amount=o.gross_amount,
                amount_paid=paid, balance_due=balance, status=o.status,
            )
            for o, paid, balance in rows
        ]
        return VehicleLedgerResponse(
            vehicle_id=vehicle.id, vehicle_label=vehicle.plate or vehicle.name_de,
            date_from=date_from, date_to=date_to,
            orders=orders, totals=VehicleLedgerTotals(**totals),
        )

    @staticmethod
    def ledger_pdf_path(db: Session, vehicle_id: UUID, date_from: date | None, date_to: date | None) -> str:
        vehicle, rows, totals = VehiclesService.get_ledger(db, vehicle_id, date_from, date_to)
        return str(Path(VehicleLedgerPdfService.render(db, vehicle, rows, totals, date_from, date_to)).resolve())
