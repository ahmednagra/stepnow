# apps/backend/app/Services/DriversService.py
# Business logic for drivers. Static-method + AuditService pattern (matches OrdersService).

from datetime import datetime, timezone
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.drivers import Driver
from app.Models.orders import Order
from app.Services.AuditService import AuditService


class DriversService:

    @staticmethod
    def _snapshot(d: Driver) -> dict:
        return {"full_name": d.full_name, "email": d.email, "phone": d.phone, "active": d.active}

    @staticmethod
    def list(db: Session, page: int, size: int, q: str | None, active_only: bool, include_deleted: bool):
        query = db.query(Driver)
        if not include_deleted:
            query = query.filter(Driver.is_deleted == False)  # noqa: E712
        if active_only:
            query = query.filter(Driver.active == True)  # noqa: E712
        if q:
            like = f"%{q}%"
            query = query.filter((Driver.full_name.ilike(like)) | (Driver.email.ilike(like)) | (Driver.phone.ilike(like)))
        total = query.count()
        items = query.order_by(Driver.full_name.asc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def get(db: Session, driver_id: UUID, allow_deleted: bool = True) -> Driver:
        q = db.query(Driver).filter(Driver.id == driver_id)
        if not allow_deleted:
            q = q.filter(Driver.is_deleted == False)  # noqa: E712
        d = q.first()
        if not d:
            raise NotFoundError("Driver not found", driver_id=str(driver_id))
        return d

    @staticmethod
    def create(db: Session, data: dict, actor: AdminUser, request: Request) -> Driver:
        d = Driver(**data)
        db.add(d)
        db.flush()
        AuditService.log(db, actor, "drivers", str(d.id), "create", None, DriversService._snapshot(d), request)
        db.commit()
        db.refresh(d)
        return d

    @staticmethod
    def update(db: Session, driver_id: UUID, data: dict, actor: AdminUser, request: Request) -> Driver:
        d = DriversService.get(db, driver_id)
        before = DriversService._snapshot(d)
        for k, v in data.items():
            setattr(d, k, v)
        AuditService.log(db, actor, "drivers", str(d.id), "update", before, DriversService._snapshot(d), request)
        db.commit()
        db.refresh(d)
        return d

    @staticmethod
    def soft_delete(db: Session, driver_id: UUID, actor: AdminUser, request: Request) -> None:
        d = DriversService.get(db, driver_id)
        before = DriversService._snapshot(d)
        d.is_deleted = True
        d.deleted_at = datetime.now(timezone.utc)
        d.deleted_by = actor.id
        AuditService.log(db, actor, "drivers", str(d.id), "delete", before, DriversService._snapshot(d), request)
        db.commit()

    @staticmethod
    def list_orders(db: Session, driver_id: UUID):
        DriversService.get(db, driver_id)
        return (
            db.query(Order)
            .filter(Order.driver_id == driver_id, Order.is_deleted == False)  # noqa: E712
            .order_by(Order.created_at.desc())
            .all()
        )
