# apps/backend/scripts/seeders/seed_drivers.py
# Idempotent seeder for couriers/drivers (the Fahrauftrag recipients). Idempotent by email.

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402

DRIVERS = [
    {
        "full_name": "Murat Yilmaz",
        "phone": "+49 159 01225851",
        "email": "murat.yilmaz@step-now.de",
        "vehicle_label": "Mercedes-Benz B-Klasse · SN 1122",
        "active": True,
        "internal_notes": "Seed: primary courier driver.",
    },
    {
        "full_name": "Stefan Wagner",
        "phone": "+49 159 01225852",
        "email": "stefan.wagner@step-now.de",
        "vehicle_label": "Mercedes-Benz B-Klasse · SN 9889",
        "active": True,
        "internal_notes": "Seed: secondary driver.",
    },
    {
        "full_name": "Ali Khan",
        "phone": "+49 159 01225853",
        "email": "ali.khan@step-now.de",
        "vehicle_label": "Mercedes-Benz B-Klasse · SN 924",
        "active": True,
        "internal_notes": "Seed: on-call.",
    },
]


def run() -> None:
    log_section(f"Drivers ({len(DRIVERS)} drivers)")
    db = SessionLocal()
    try:
        from app.Models.drivers import Driver
        from app.Services.DriversService import DriversService

        actor = get_system_actor(db)
        created = skipped = 0
        for data in DRIVERS:
            existing = db.query(Driver).filter(Driver.email == data["email"]).first()
            if existing:
                log_skip(f"driver '{data['email']}'", f"id={existing.id}")
                skipped += 1
                continue
            d = DriversService.create(db, dict(data), actor, request=None)
            log_create(f"driver '{d.full_name}'", f"id={d.id}")
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
