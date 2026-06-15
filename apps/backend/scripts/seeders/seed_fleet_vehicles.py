# apps/backend/scripts/seeders/seed_fleet_vehicles.py
# Seeds the OPERATIONAL fleet from StepNow_Data.json → `fahrzeuge` into the SHARED vehicles
# table (a row carrying a `plate` is an operational car). These rows are public_visible=False so
# they don't appear on the public showcase, but are fully usable for orders/assignments.
# Idempotent by (normalised) plate via FleetService.get_or_create.
#
# Note: the orders import (seed_legacy_orders) auto-registers any extra plate it references
# that is not listed here, so the fleet registry is always a superset of "cars seen on jobs".

from config.database import SessionLocal
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402,F401

# Mirrors StepNow_Data.json `fahrzeuge` (name → typ). typ: firm = company car, priv = private.
FLEET = [
    {"plate": "SN 1122", "ownership_type": "firm"},
    {"plate": "SN 9889", "ownership_type": "firm"},
    {"plate": "SN 924", "ownership_type": "firm"},
    {"plate": "Ersatzwagen", "ownership_type": "priv"},
]


def run() -> None:
    log_section(f"Fleet Vehicles ({len(FLEET)} from fahrzeuge)")
    db = SessionLocal()
    try:
        from app.Services.FleetService import FleetService

        get_system_actor(db)  # ensure system actor exists (consistency with other seeders)
        created = skipped = 0
        for f in FLEET:
            existing = FleetService.get_by_plate(db, f["plate"])
            if existing:
                log_skip(f"fleet '{f['plate']}'", f"id={existing.id}")
                skipped += 1
                continue
            v = FleetService.get_or_create(
                db,
                f["plate"],
                ownership_type=f["ownership_type"],
            )
            log_create(f"fleet '{v.plate}'", f"typ={v.ownership_type}")
            created += 1
        db.commit()
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
