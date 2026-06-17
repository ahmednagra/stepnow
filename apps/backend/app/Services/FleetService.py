# apps/backend/app/Services/FleetService.py
# Operational-fleet read/trace logic on top of the shared `vehicles` table. The vehicles table
# is the single registry: a row is an operational car when it carries a `plate`. Everything the
# brief asked to "trace, no gaps":
#
#   • vehicle_orders(car)             — a car's complete order history.
#   • driver_orders(driver)           — every order attributable to a driver (see below).
#   • driver_vehicle_orders(drv, car) — the (driver, car) intersection, e.g. "driver A with
#                                       SN 9889 → these N jobs, with full detail".
#   • driver_vehicle_summary(driver)  — who drove which car, when, and how many jobs resulted.
#
# Attribution model (important): the imported legacy orders carry NO per-order driver — only the
# car (StepNow_Data.json `fahr` is empty). So a driver's orders are the UNION of:
#   (a) orders explicitly linked via Order.driver_id (honoured first, future-proof), and
#   (b) orders whose vehicle + date fall inside one of the driver's assignment windows.
# This keeps history correct under weekly car rotation without inventing data.

from __future__ import annotations

from decimal import Decimal
from uuid import UUID
from sqlalchemy import Date, and_, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.Models.driver_vehicle_assignments import DriverVehicleAssignment
from app.Models.orders import Order
from app.Models.vehicles import Vehicle


# ── Plate normalisation ──────────────────────────────────────────────────────
def normalize_plate(plate: str) -> str:
    """Canonical STORAGE form: collapse internal whitespace and trim, but preserve the given
    casing (so "Ersatzwagen" stays readable). Matching is done case-insensitively in
    get_by_plate, so "sn 9889" and "SN 9889" still resolve to the same row."""
    return " ".join((plate or "").split())


class FleetService:

    # ── Fleet registry over the vehicles table (also used by seeders) ────────
    @staticmethod
    def get_by_plate(db: Session, plate: str) -> Vehicle | None:
        canon = normalize_plate(plate)
        if not canon:
            return None
        return (
            db.query(Vehicle)
            .filter(func.upper(Vehicle.plate) == canon.upper())
            .first()
        )

    @staticmethod
    def get_or_create(
        db: Session,
        plate: str,
        *,
        ownership_type: str = "firm",
        label: str | None = None,
        notes: str | None = None,
    ) -> Vehicle | None:
        """Idempotent fleet lookup by plate over the vehicles table. Auto-registers an unseen
        plate as an operational-only vehicle (public_visible=False) so an order can never end up
        orphaned (gap-free). Required marketing columns are filled with the plate as a structural
        placeholder — no business data is invented. The caller commits."""
        canon = normalize_plate(plate)
        if not canon:
            return None
        existing = FleetService.get_by_plate(db, canon)
        if existing:
            return existing
        name = label or canon
        vehicle = Vehicle(
            plate=canon,
            ownership_type=ownership_type,
            name_de=name,
            name_en=name,
            category="fleet",
            capacity_passengers=1,
            capacity_luggage=0,
            features_de=[],
            features_en=[],
            active=True,
            public_visible=False,  # operational-only: kept off the public showcase
            sort_order=0,
            image_url=None,
        )
        db.add(vehicle)
        db.flush()
        return vehicle

    @staticmethod
    def list_fleet(db: Session, include_deleted: bool = False) -> list[Vehicle]:
        """All operational cars (rows that carry a plate), plate-sorted."""
        q = db.query(Vehicle).filter(Vehicle.plate.isnot(None))
        if not include_deleted:
            q = q.filter(Vehicle.is_deleted == False)  # noqa: E712
        return q.order_by(Vehicle.plate).all()

    # ── Order date used for window matching ──────────────────────────────────
    @staticmethod
    def _order_date_expr():
        # The service date is what counts for "which car/driver did this job", in priority:
        # scheduled_datetime (the termin) → preferred_date → created_at.
        return func.coalesce(
            cast(Order.scheduled_datetime, Date),
            Order.preferred_date,
            cast(Order.created_at, Date),
        )

    @staticmethod
    def _base_orders(db: Session, include_deleted: bool):
        q = db.query(Order)
        if not include_deleted:
            q = q.filter(Order.is_deleted == False)  # noqa: E712
        return q

    # ── Car order history ────────────────────────────────────────────────────
    @staticmethod
    def vehicle_orders(
        db: Session, vehicle_id: UUID, include_deleted: bool = False
    ) -> list[Order]:
        return (
            FleetService._base_orders(db, include_deleted)
            .filter(Order.vehicle_id == vehicle_id)
            .order_by(FleetService._order_date_expr().desc())
            .all()
        )

    # ── Driver order history (direct + derived via assignment windows) ───────
    @staticmethod
    def _driver_attribution_filter(
        db: Session, driver_id: UUID, vehicle_id: UUID | None = None
    ):
        """Build the OR-condition that selects a driver's orders. Pass vehicle_id to restrict to
        the (driver, car) intersection."""
        order_date = FleetService._order_date_expr()
        conds = []

        # (a) explicit direct attribution
        direct = Order.driver_id == driver_id
        if vehicle_id is not None:
            direct = and_(direct, Order.vehicle_id == vehicle_id)
        conds.append(direct)

        # (b) derived from assignment windows
        aq = db.query(DriverVehicleAssignment).filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.is_deleted == False,  # noqa: E712
        )
        if vehicle_id is not None:
            aq = aq.filter(DriverVehicleAssignment.vehicle_id == vehicle_id)
        for w in aq.all():
            c = and_(
                Order.vehicle_id == w.vehicle_id,
                order_date >= w.start_date,
            )
            if w.end_date is not None:
                c = and_(c, order_date <= w.end_date)
            conds.append(c)

        return or_(*conds)

    @staticmethod
    def driver_orders(
        db: Session, driver_id: UUID, include_deleted: bool = False
    ) -> list[Order]:
        return (
            FleetService._base_orders(db, include_deleted)
            .filter(FleetService._driver_attribution_filter(db, driver_id))
            .order_by(FleetService._order_date_expr().desc())
            .all()
        )

    @staticmethod
    def driver_vehicle_orders(
        db: Session,
        driver_id: UUID,
        vehicle_id: UUID,
        include_deleted: bool = False,
    ) -> list[Order]:
        """The exact trace the brief describes: "driver A with car X → these jobs"."""
        return (
            FleetService._base_orders(db, include_deleted)
            .filter(FleetService._driver_attribution_filter(db, driver_id, vehicle_id))
            .order_by(FleetService._order_date_expr().desc())
            .all()
        )

    # ── Roll-up: per (driver, car) assignment, count + value of resulting jobs ─
    @staticmethod
    def driver_vehicle_summary(db: Session, driver_id: UUID) -> list[dict]:
        """One row per car the driver was assigned to: window(s), orders count, gross total."""
        assignments = (
            db.query(DriverVehicleAssignment)
            .options(joinedload(DriverVehicleAssignment.vehicle))
            .filter(
                DriverVehicleAssignment.driver_id == driver_id,
                DriverVehicleAssignment.is_deleted == False,  # noqa: E712
            )
            .order_by(DriverVehicleAssignment.start_date)
            .all()
        )
        # Fetch the driver's attributed orders ONCE, then bucket by vehicle in Python. An attributed
        # order's window (or direct link) already constrains Order.vehicle_id, so an order in the
        # bucket for vehicle V is exactly one the old per-V driver_vehicle_orders call returned —
        # the grouped count/total is value-identical. Two windows on the same car still emit two
        # rows (one per assignment), each carrying that car's full bucket, as before.
        by_vehicle: dict[UUID, list[Order]] = {}
        for o in FleetService.driver_orders(db, driver_id):
            by_vehicle.setdefault(o.vehicle_id, []).append(o)
        return [
            {
                "vehicle_id": a.vehicle_id,
                "plate": a.vehicle.plate if a.vehicle else None,
                "start_date": a.start_date,
                "end_date": a.end_date,
                "is_primary": a.is_primary,
                "orders_count": len(by_vehicle.get(a.vehicle_id, [])),
                "gross_total": sum(
                    (o.gross_amount for o in by_vehicle.get(a.vehicle_id, [])), Decimal("0.00")
                ),
            }
            for a in assignments
        ]
