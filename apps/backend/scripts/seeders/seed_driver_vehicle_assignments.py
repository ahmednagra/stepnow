# apps/backend/scripts/seeders/seed_driver_vehicle_assignments.py
# Opens the initial driver↔fleet-car assignment history. This does NOT invent new data: it
# normalises the plate already embedded in each seeded driver's `vehicle_label`
# (e.g. "Mercedes-Benz B-Klasse · SN 1122") into a proper DriverVehicleAssignment row, so the
# (driver, car, orders) trace works end-to-end.
#
# Each driver gets one OPEN assignment (end_date = NULL = current car) starting at the first
# legacy job date. Weekly rotation later = close this row and open a new one via the admin UI;
# the history table preserves every past window. Idempotent by (driver, car) open assignment.

import re
from datetime import date

from config.database import SessionLocal
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402,F401

# First job date in the legacy import — the assignments start here so derived attribution
# covers the whole imported order history.
FLEET_HISTORY_START = date(2026, 5, 1)

# Matches the plate inside a free-text vehicle label: "SN 1122", "SN 924", "Ersatzwagen".
_PLATE_RE = re.compile(r"(SN\s*\d+|Ersatzwagen)", re.IGNORECASE)


def _extract_plate(label: str | None) -> str | None:
    if not label:
        return None
    m = _PLATE_RE.search(label)
    return m.group(1) if m else None


def run() -> None:
    log_section("Driver ↔ Fleet assignments (from existing driver vehicle_label)")
    db = SessionLocal()
    try:
        from app.Models.drivers import Driver
        from app.Models.driver_vehicle_assignments import DriverVehicleAssignment
        from app.Services.FleetService import FleetService

        get_system_actor(db)
        created = skipped = no_plate = 0

        for driver in db.query(Driver).filter(Driver.is_deleted == False).all():  # noqa: E712
            plate = _extract_plate(driver.vehicle_label)
            if not plate:
                no_plate += 1
                log_skip(f"driver '{driver.full_name}'", "no plate in vehicle_label")
                continue

            # Resolve (or register) the fleet car for this plate.
            vehicle = FleetService.get_or_create(
                db,
                plate,
                ownership_type="priv" if plate.strip().lower() == "ersatzwagen" else "firm",
                notes="Auto-registered from driver assignment seed.",
            )

            # Idempotency: skip if this driver already has an OPEN assignment to this car.
            existing = (
                db.query(DriverVehicleAssignment)
                .filter(
                    DriverVehicleAssignment.driver_id == driver.id,
                    DriverVehicleAssignment.vehicle_id == vehicle.id,
                    DriverVehicleAssignment.end_date.is_(None),
                    DriverVehicleAssignment.is_deleted == False,  # noqa: E712
                )
                .first()
            )
            if existing:
                log_skip(f"assign '{driver.full_name}'→'{vehicle.plate}'", f"id={existing.id}")
                skipped += 1
                continue

            assignment = DriverVehicleAssignment(
                driver_id=driver.id,
                vehicle_id=vehicle.id,
                start_date=FLEET_HISTORY_START,
                end_date=None,
                is_primary=True,
                notes="Seed: initial assignment from driver vehicle_label.",
            )
            db.add(assignment)
            db.flush()
            log_create(f"assign '{driver.full_name}'→'{vehicle.plate}'", f"since {FLEET_HISTORY_START}")
            created += 1

        db.commit()
        print(f"  [done] {created} created, {skipped} skipped, {no_plate} without plate")
    finally:
        db.close()


if __name__ == "__main__":
    run()
