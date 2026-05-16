# apps/backend/app/Services/DashboardService.py
# Aggregates dashboard SSR data with COUNT and GROUP BY queries instead of fetching full row lists. Each method is one or two SQL roundtrips total; no row payload is serialized for counts (fixes M-3).

from datetime import datetime, timezone
from typing import Any
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from app.Models.services import Service
from app.Models.vehicles import Vehicle
from app.Models.bookings import BookingRequest
from app.Models.contact import ContactMessage

_HEATMAP_HOURS = (6, 8, 10, 12, 14, 16, 18, 20)


def _snap_hour(h: int) -> int:
    best = _HEATMAP_HOURS[0]
    best_d = abs(h - best)
    for slot in _HEATMAP_HOURS[1:]:
        d = abs(h - slot)
        if d < best_d:
            best = slot
            best_d = d
    return best


class DashboardService:

    @staticmethod
    def get_totals(db: Session) -> dict[str, Any]:
        services_total = db.query(func.count(Service.id)).filter(Service.is_deleted == False).scalar() or 0
        services_active = db.query(func.count(Service.id)).filter(Service.is_deleted == False, Service.active == True).scalar() or 0
        vehicles_total = db.query(func.count(Vehicle.id)).filter(Vehicle.is_deleted == False).scalar() or 0
        vehicles_active = db.query(func.count(Vehicle.id)).filter(Vehicle.is_deleted == False, Vehicle.active == True).scalar() or 0
        bookings_total = db.query(func.count(BookingRequest.id)).filter(BookingRequest.is_deleted == False).scalar() or 0
        bookings_new = db.query(func.count(BookingRequest.id)).filter(BookingRequest.is_deleted == False, BookingRequest.status == "new").scalar() or 0
        messages_total = db.query(func.count(ContactMessage.id)).filter(ContactMessage.is_deleted == False).scalar() or 0
        messages_unread = db.query(func.count(ContactMessage.id)).filter(ContactMessage.is_deleted == False, ContactMessage.is_handled == False).scalar() or 0
        return {
            "services": {"total": int(services_total), "active": int(services_active)},
            "vehicles": {"total": int(vehicles_total), "active": int(vehicles_active)},
            "bookings": {"total": int(bookings_total), "new_count": int(bookings_new)},
            "messages": {"total": int(messages_total), "unread": int(messages_unread)},
        }

    @staticmethod
    def heatmap(db: Session) -> dict[str, Any]:
        dow = extract("dow", BookingRequest.requested_datetime)
        hour = extract("hour", BookingRequest.requested_datetime)
        rows = (
            db.query(dow.label("dow"), hour.label("hour"), func.count(BookingRequest.id).label("c"))
            .filter(BookingRequest.is_deleted == False)
            .group_by(dow, hour)
            .all()
        )
        bucket: dict[tuple[int, int], int] = {}
        for r in rows:
            day = (int(r.dow) + 6) % 7
            snap = _snap_hour(int(r.hour))
            key = (day, snap)
            bucket[key] = bucket.get(key, 0) + int(r.c)
        cells: list[dict[str, int]] = []
        for day in range(7):
            for h in _HEATMAP_HOURS:
                cells.append({"day": day, "hour": h, "value": bucket.get((day, h), 0)})
        return {"cells": cells}

    @staticmethod
    def upcoming(db: Session, limit: int) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        rows = (
            db.query(BookingRequest)
            .filter(BookingRequest.is_deleted == False)
            .filter(BookingRequest.requested_datetime >= now)
            .filter(BookingRequest.status != "cancelled")
            .filter(BookingRequest.status != "completed")
            .order_by(BookingRequest.requested_datetime.asc())
            .limit(limit)
            .all()
        )
        return {"items": rows}
