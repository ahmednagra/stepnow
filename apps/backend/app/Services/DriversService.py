# apps/backend/app/Services/DriversService.py
# Business logic for drivers. Static-method + AuditService pattern (matches OrdersService).
# Adds the §21 StVG licence-check recorder and per-driver job aggregates.

from datetime import datetime, timezone, date, timedelta
from uuid import UUID
from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.drivers import Driver
from app.Models.orders import Order
from app.Services.AuditService import AuditService


def _add_months(d: date, months: int) -> date:
    m = d.month - 1 + months
    y = d.year + m // 12
    mo = m % 12 + 1
    # clamp day to month length (28 is safe for our use)
    day = min(d.day, 28)
    return date(y, mo, day)


class DriversService:

    @staticmethod
    def _snapshot(d: Driver) -> dict:
        return {"full_name": d.full_name, "email": d.email, "phone": d.phone, "active": d.active}

    @staticmethod
    def driver_list(db: Session, page: int, size: int, q: str | None, active_only: bool, include_deleted: bool):
        query = db.query(Driver)
        if not include_deleted:
            query = query.filter(Driver.is_deleted == False)  # noqa: E712
        if active_only:
            query = query.filter(Driver.active == True)  # noqa: E712
        if q:
            like = f"%{q}%"
            query = query.filter(
                (Driver.full_name.ilike(like))
                | (Driver.email.ilike(like))
                | (Driver.phone.ilike(like))
                | (Driver.license_number.ilike(like))
            )
        total = query.count()
        items = query.order_by(Driver.full_name.asc()).offset((page - 1) * size).limit(size).all()
        return items, total

    @staticmethod
    def aggregates_for(db: Session, driver_ids: list[UUID]) -> dict[UUID, dict]:
        """Per-driver job rollups (count + last dispatch) in one grouped query."""
        if not driver_ids:
            return {}
        rows = (
            db.query(
                Order.driver_id.label("did"),
                func.count(Order.id).label("orders_count"),
                func.max(func.coalesce(Order.scheduled_datetime, Order.created_at)).label("last_dispatch_at"),
            )
            .filter(Order.driver_id.in_(driver_ids), Order.is_deleted == False)  # noqa: E712
            .group_by(Order.driver_id)
            .all()
        )
        return {
            r.did: {"orders_count": int(r.orders_count or 0), "last_dispatch_at": r.last_dispatch_at}
            for r in rows
        }

    @staticmethod
    def compliance_status(d: Driver, today: date | None = None) -> str:
        """ok | due | expired | blocked | unknown — same spirit as the orders is_overdue derive."""
        today = today or date.today()
        if not d.license_expiry and not d.last_license_check_at:
            return "unknown"
        if d.license_expiry and d.license_expiry < today:
            return "blocked"
        if d.next_license_check_due and d.next_license_check_due < today:
            return "expired"
        soon = today + timedelta(days=30)
        if (d.next_license_check_due and d.next_license_check_due <= soon) or (
            d.license_expiry and d.license_expiry <= soon
        ):
            return "due"
        return "ok"

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
        # If licence data was provided at create, treat now as the first §21 check.
        if d.license_number or d.license_expiry:
            today = date.today()
            d.last_license_check_at = today
            d.next_license_check_due = _add_months(today, 6)
            d.last_checked_by = actor.id
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
    def record_license_check(
        db: Session, driver_id: UUID, checked_on: date | None, interval_months: int,
        notes: str | None, actor: AdminUser, request: Request,
    ) -> Driver:
        d = DriversService.get(db, driver_id)
        when = checked_on or date.today()
        before = {
            "last_license_check_at": d.last_license_check_at.isoformat() if d.last_license_check_at else None,
            "next_license_check_due": d.next_license_check_due.isoformat() if d.next_license_check_due else None,
        }
        next_due = _add_months(when, interval_months)
        d.last_license_check_at = when
        d.next_license_check_due = next_due
        d.last_checked_by = actor.id
        after = {
            "last_license_check_at": when.isoformat(),
            "next_license_check_due": next_due.isoformat(),
            "interval_months": interval_months,
        }
        AuditService.log(db, actor, "drivers", str(d.id), "license_check", before, after, request)
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
