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
        # Business trim
        "features_de": [
            "Klimaautomatik",
            "Ledersitze",
            "WLAN an Bord",
            "Kabelloses Laden",
            "Panoramadach",
            "Wasser-Service",
        ],
        "features_en": [
            "Automatic climate control",
            "Leather seats",
            "On-board Wi-Fi",
            "Wireless charging",
            "Panoramic roof",
            "Complimentary water",
        ],
        "image_url": "https://media.oneweb.mercedes-benz.com/images/dynamic/europe/GB/247087/806_056/iris.png?q=COSY-EU-100-1713d0VXqaWFqtyO67PobzIr3eWsrrCsdRRzwQZxkIZbMw3SGtGyUtsd2sDcUfp8fXGEuiRJ0l3IJOB2NMcbApjTlI5uV6%25QC31C1kzNwtnm7jA6ZhKV5XN%25vq4t9yLRgcRYaxPa9rH1ejun8wsbfoiZrb1M4FnKJTg95vp6PDCIoSeWHmUtsd8J3cUfiMcXGE4TwJ0lgOrOB2PzqbApe79I5usr2QC32hOkzNL6Sm%25kbFDZk3tsdB%25ycJtj9GXOcBYqJ0l40xOB2igBbAp0ToI5uC5JQC3zgOkzN7t6m7jK2IhKUWP3IrZxD%25WLfscVvVS%25qjuauQFQ0ZzKG1BZeEsRrbP76&BKGND=9&IMGT=P27&cp=U7lLKRUtPa6KAFr8s_ubHw&uni=m&POV=BE040,PZM",
    },
    {
        "sort_order": 20,
        "active": True,
        "name_de": "Mercedes-Benz B-Klasse — Polarweiß",
        "name_en": "Mercedes-Benz B-Class — Polar White",
        "category": "sedan",
        "capacity_passengers": 4,
        "capacity_luggage": 4,
        # Family trim
        "features_de": [
            "Klimaanlage",
            "Stoff-/Ledersitze",
            "Kindersitz auf Anfrage",
            "USB-Ladeports",
            "Erweiterter Gepäckraum",
            "Bluetooth-Audio",
        ],
        "features_en": [
            "Climate control",
            "Fabric / leather seats",
            "Child seat on request",
            "USB charging ports",
            "Extra luggage space",
            "Bluetooth audio",
        ],
        "image_url": "https://media.oneweb.mercedes-benz.com/images/dynamic/europe/GB/247087/806_056/iris.png?q=COSY-EU-100-1713d0VXqaWFqtyO67PobzIr3eWsrrCsdRRzwQZg9pZbMw3SGtGyUtsd2sDcUfp8fXGEuiRJ0l3IJOB2NMcbApjTlI5uV6%25QC31C1kzNwtnm7jA6ZhKV5XN%25vq4t9yLRgcRYaxPa9rH1ejun8wsbfoiZrb1M4FnKJTg95vp6PDCIoSeWHmUtsd8J3cUfiMcXGE4TwJ0lgOrOB2PzqbApe79I5usr2QC32hOkzNL6Sm%25kbFDZk3tsdB%25ycJtj9GXOcBYqJ0l40xOB2igBbAp0ToI5uC5JQC3zgOkzN7t6m7jK2IhKUWP3IrZxD%25WLfscVvVS%25qjuauQFQ0ZzKG1BZeEsRrbP76&BKGND=9&IMGT=P27&cp=U7lLKRUtPa6KAFr8s_ubHw&uni=m&POV=BE340",
    },
    {
        "sort_order": 30,
        "active": True,
        "name_de": "Mercedes-Benz B-Klasse — Iridiumsilber",
        "name_en": "Mercedes-Benz B-Class — Iridium Silver",
        "category": "sedan",
        "capacity_passengers": 4,
        "capacity_luggage": 3,
        # Tech / comfort trim
        "features_de": [
            "Klimaautomatik",
            "Ledersitze",
            "Apple CarPlay & Android Auto",
            "USB-Ladeports",
            "Ambientebeleuchtung",
            "Pünktlichkeits-Garantie",
        ],
        "features_en": [
            "Automatic climate control",
            "Leather seats",
            "Apple CarPlay & Android Auto",
            "USB charging ports",
            "Ambient lighting",
            "Punctuality guarantee",
        ],
        "image_url": "https://media.oneweb.mercedes-benz.com/images/dynamic/europe/GB/247087/806_056/iris.png?q=COSY-EU-100-1713d0VXqaWFqtyO67PobzIr3eWsrrCsdRRzwQZUnRZbMw3SGtGyUtsd2sDcUfp8fXGEuiRJ0l3IJOB2NMcbApjTlI5uV6%25QC31C1kzNwtnm7jA6ZhKV5XN%25vq4t9yLRgcRYaxPa9rH1ejun8wsbfoiZrb1M4FnKJTg95vp6PDCIoSeWHmUtsd8J3cUfiMcXGE4TwJ0lgOrOB2PzqbApe79I5usr2QC32hOkzNL6Sm%25kbFDZk3tsdB%25ycJtj9GXOcBYqJ0l40xOB2igBbAp0ToI5uC5JQC3zgOkzN7t6m7jK2IhKUWP3IrZxD%25WLfscVvVS%25qjuauQFQ0ZzKG1BZeEsRrbP76&BKGND=9&IMGT=P27&cp=U7lLKRUtPa6KAFr8s_ubHw&uni=m&POV=BE290",
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
