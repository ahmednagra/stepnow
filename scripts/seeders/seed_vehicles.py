# scripts/seeders/seed_vehicles.py
"""Seed the fleet — three vehicles realistic for a small Mietwagen operator.

- Mercedes E-Klasse (sedan, business standard)
- Mercedes V-Klasse (van for groups + luggage-heavy airport runs)
- VW Caddy Maxi (compact, accessible — for hospital + school)

Idempotent: keyed by name_de.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


VEHICLES = [
    {
        "sort_order": 10,
        "active": True,
        "name_de": "Mercedes-Benz E-Klasse",
        "name_en": "Mercedes-Benz E-Class",
        "category": "sedan",
        "capacity_passengers": 3,
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
        "name_de": "Mercedes-Benz V-Klasse",
        "name_en": "Mercedes-Benz V-Class",
        "category": "van",
        "capacity_passengers": 7,
        "capacity_luggage": 6,
        "features_de": [
            "Klimaanlage",
            "Schiebetüren beidseitig",
            "Hohe Decke",
            "Großer Kofferraum",
            "WLAN an Bord",
            "USB-Ladeports",
            "Kindersitz auf Anfrage",
        ],
        "features_en": [
            "Climate control",
            "Sliding doors on both sides",
            "High roof",
            "Large luggage compartment",
            "On-board Wi-Fi",
            "USB charging ports",
            "Child seat on request",
        ],
        "image_url": None,
    },
    {
        "sort_order": 30,
        "active": True,
        "name_de": "VW Caddy Maxi",
        "name_en": "VW Caddy Maxi",
        "category": "accessible",
        "capacity_passengers": 4,
        "capacity_luggage": 2,
        "features_de": [
            "Klimaanlage",
            "Niederflur-Einstieg",
            "Rampe für Rollator und Rollstuhl",
            "Behindertengerecht zugänglich",
            "Begleitperson kostenfrei",
        ],
        "features_en": [
            "Climate control",
            "Low-floor entry",
            "Ramp for walker and wheelchair",
            "Accessible for disabled passengers",
            "Companion travels free",
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
            existing = db.query(Vehicle).filter(Vehicle.name_de == v_data["name_de"]).first()
            if existing:
                log_skip(f"vehicle '{v_data['name_de']}'", f"id={existing.id}")
                skipped += 1
                continue
            v = VehiclesService.create_vehicle(db, v_data, actor, request=None)
            log_create(f"vehicle '{v.name_de}'", f"{v.capacity_passengers} pax, {len(v.features_de)} features")
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
