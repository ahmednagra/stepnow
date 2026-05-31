# scripts/seeders/seed_vehicles.py
"""Seed the fleet — three Mercedes-Benz B-Klasse vehicles in different colours.

- Mercedes-Benz B-Klasse — Obsidianschwarz (black)
- Mercedes-Benz B-Klasse — Polarweiß (white)
- Mercedes-Benz B-Klasse — Iridiumsilber (silver)

Same model throughout; the colour is carried in name_de / name_en so each row is
distinct (the seeder is idempotent and keyed by name_de).
"""

from config.database import SessionLocal
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


VEHICLES = [
    {
        "sort_order": 10,
        "active": True,
        "name_de": "Mercedes-Benz B-Klasse — Obsidianschwarz",
        "name_en": "Mercedes-Benz B-Class — Obsidian Black",
        "category": "sedan",
        "capacity_passengers": 4,
        "capacity_luggage": 3,
        "features_de": [
            "Klimaanlage",
            "Ledersitze",
            "WLAN an Bord",
            "USB-Ladeports",
            "Wasser-Service",
            "Pünktlichkeits-Garantie",
        ],
        "features_en": [
            "Climate control",
            "Leather seats",
            "On-board Wi-Fi",
            "USB charging ports",
            "Complimentary water",
            "Punctuality guarantee",
        ],
        "image_url": None,
    },
    {
        "sort_order": 20,
        "active": True,
        "name_de": "Mercedes-Benz B-Klasse — Polarweiß",
        "name_en": "Mercedes-Benz B-Class — Polar White",
        "category": "sedan",
        "capacity_passengers": 4,
        "capacity_luggage": 3,
        "features_de": [
            "Klimaanlage",
            "Ledersitze",
            "WLAN an Bord",
            "USB-Ladeports",
            "Wasser-Service",
            "Pünktlichkeits-Garantie",
        ],
        "features_en": [
            "Climate control",
            "Leather seats",
            "On-board Wi-Fi",
            "USB charging ports",
            "Complimentary water",
            "Punctuality guarantee",
        ],
        "image_url": None,
    },
    {
        "sort_order": 30,
        "active": True,
        "name_de": "Mercedes-Benz B-Klasse — Iridiumsilber",
        "name_en": "Mercedes-Benz B-Class — Iridium Silver",
        "category": "sedan",
        "capacity_passengers": 4,
        "capacity_luggage": 3,
        "features_de": [
            "Klimaanlage",
            "Ledersitze",
            "WLAN an Bord",
            "USB-Ladeports",
            "Wasser-Service",
            "Pünktlichkeits-Garantie",
        ],
        "features_en": [
            "Climate control",
            "Leather seats",
            "On-board Wi-Fi",
            "USB charging ports",
            "Complimentary water",
            "Punctuality guarantee",
        ],
        "image_url": None,
    },
]


def run() -> None:
    log_section(f"Vehicles ({len(VEHICLES)} vehicles)")
    db = SessionLocal()
    try:
        from app.Models.vehicles import Vehicle
        from app.Services.VehiclesService import VehiclesService

        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for v_data in VEHICLES:
            existing = (
                db.query(Vehicle).filter(Vehicle.name_de == v_data["name_de"]).first()
            )
            if existing:
                log_skip(f"vehicle '{v_data['name_de']}'", f"id={existing.id}")
                skipped += 1
                continue
            v = VehiclesService.create_vehicle(db, v_data, actor, request=None)
            log_create(
                f"vehicle '{v.name_de}'",
                f"{v.capacity_passengers} pax, {len(v.features_de)} features",
            )
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
