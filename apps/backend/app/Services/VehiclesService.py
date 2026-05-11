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

_FIELDS = ("sort_order", "active", "name_de", "name_en", "category", "capacity_passengers", "capacity_luggage", "features_de", "features_en", "image_url")


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
        return db.query(Vehicle).filter(Vehicle.active == True, Vehicle.is_deleted == False).order_by(Vehicle.sort_order, Vehicle.created_at).all()

    @staticmethod
    def _snapshot(v: Vehicle) -> dict[str, Any]:
        return {f: getattr(v, f) for f in _FIELDS}
