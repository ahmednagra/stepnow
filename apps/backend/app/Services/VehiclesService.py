# apps/backend/app/Services/VehiclesService.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.vehicles import Vehicle
from app.Services.AuditService import AuditService

_FIELDS = ("sort_order", "active", "public_visible", "plate", "ownership_type", "name_de", "name_en", "category", "capacity_passengers", "capacity_luggage", "features_de", "features_en", "image_url")


class VehiclesService:

    @staticmethod
    def list_vehicles(db: Session, page: int, size: int, q: str | None, category: str | None, include_inactive: bool, include_deleted: bool) -> tuple[list[Vehicle], int]:
        query = db.query(Vehicle)
        if not include_deleted:
            query = query.filter(Vehicle.is_deleted == False)
        if not include_inactive:
            query = query.filter(Vehicle.active == True)
        if category:
            query = query.filter(Vehicle.category == category)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(Vehicle.name_de.ilike(like), Vehicle.name_en.ilike(like), Vehicle.category.ilike(like)))
        total = query.with_entities(func.count(Vehicle.id)).scalar() or 0
        items = query.order_by(Vehicle.sort_order, Vehicle.created_at).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get_vehicle(db: Session, vehicle_id: UUID, allow_deleted: bool = False) -> Vehicle:
        query = db.query(Vehicle).filter(Vehicle.id == vehicle_id)
        if not allow_deleted:
            query = query.filter(Vehicle.is_deleted == False)
        v = query.first()
        if not v:
            raise NotFoundError("Vehicle not found", vehicle_id=str(vehicle_id))
        return v

    @staticmethod
    def get_ledger(db: Session, vehicle_id: UUID, date_from=None, date_to=None):
        """Per-vehicle account: that vehicle's orders with their ORDER amounts (frozen — never the
        editable invoice amounts). Returns (vehicle, [(order, paid, balance)], totals)."""
        from app.Services.FleetService import FleetService
        from app.Services.PaymentsService import PaymentsService
        from app.Utils.finance import money
        vehicle = VehiclesService.get_vehicle(db, vehicle_id, allow_deleted=True)
        orders = FleetService.vehicle_orders(db, vehicle_id)

        def _d(o):
            return o.preferred_date or (o.scheduled_datetime.date() if o.scheduled_datetime else None)
        if date_from:
            orders = [o for o in orders if _d(o) and _d(o) >= date_from]
        if date_to:
            orders = [o for o in orders if _d(o) and _d(o) <= date_to]

        paid_map = PaymentsService.totals_for(db, [o.id for o in orders])
        rows = [(o, paid_map.get(o.id, money(0)), money(o.gross_amount - paid_map.get(o.id, money(0)))) for o in orders]
        totals = {
            "count": len(rows),
            "net": money(sum((o.net_amount for o in orders), money(0))),
            "gross": money(sum((o.gross_amount for o in orders), money(0))),
            "paid": money(sum((p for _, p, _ in rows), money(0))),
            "balance": money(sum((b for _, _, b in rows), money(0))),
        }
        return vehicle, rows, totals

    @staticmethod
    def create_vehicle(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Vehicle:
        v = Vehicle(**data)
        db.add(v)
        db.flush()
        AuditService.log(db, actor, "vehicles", str(v.id), "create", None, VehiclesService._snapshot(v), request)
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def update_vehicle(db: Session, vehicle_id: UUID, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> Vehicle:
        v = VehiclesService.get_vehicle(db, vehicle_id)
        before = VehiclesService._snapshot(v)
        for k, val in data.items():
            setattr(v, k, val)
        db.flush()
        AuditService.log(db, actor, "vehicles", str(v.id), "update", before, VehiclesService._snapshot(v), request)
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def soft_delete_vehicle(db: Session, vehicle_id: UUID, actor: AdminUser, request: Request | None = None) -> None:
        v = VehiclesService.get_vehicle(db, vehicle_id)
        before = VehiclesService._snapshot(v)
        v.is_deleted = True
        v.deleted_at = datetime.now(timezone.utc)
        v.deleted_by = actor.id
        AuditService.log(db, actor, "vehicles", str(v.id), "soft_delete", before, VehiclesService._snapshot(v), request)
        db.commit()

    @staticmethod
    def restore_vehicle(db: Session, vehicle_id: UUID, actor: AdminUser, request: Request | None = None) -> Vehicle:
        v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.is_deleted == True).first()
        if not v:
            raise NotFoundError("Deleted vehicle not found", vehicle_id=str(vehicle_id))
        before = VehiclesService._snapshot(v)
        v.is_deleted = False
        v.deleted_at = None
        v.deleted_by = None
        AuditService.log(db, actor, "vehicles", str(v.id), "restore", before, VehiclesService._snapshot(v), request)
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def list_public(db: Session) -> list[Vehicle]:
        # public_visible keeps operational-only fleet cars (plates) off the public showcase.
        return db.query(Vehicle).filter(
            Vehicle.active == True, Vehicle.is_deleted == False, Vehicle.public_visible == True
        ).order_by(Vehicle.sort_order, Vehicle.created_at).all()

    @staticmethod
    def _snapshot(v: Vehicle) -> dict[str, Any]:
        return {f: getattr(v, f) for f in _FIELDS}
