# scripts/seeders/seed_pricing.py
"""Seed pricing categories and items for each service.

Real Stuttgart-area routes with realistic prices (Endpreise — VAT is included in
the price and not shown separately).
- Airport: STR, FRA, MUC, FMM, FKB
- Hospital: Klinikum Esslingen, Klinikum Stuttgart, Marienhospital, etc.
- School: Stuttgart Gymnasien from suburban towns
- Shuttle: Weddings, conferences

Depends on services already being seeded (looks up by slug_de).
Idempotent: keyed by (service_id, name_de) for categories.
"""

from decimal import Decimal

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


# Format: { "service_slug_de": [ { category }, ... ] }
# Each category has nested "items" list
PRICING_DATA = {
    "flughafentransfer": [
        {
            "sort_order": 10,
            "name_de": "Flughafen Stuttgart (STR)",
            "name_en": "Stuttgart Airport (STR)",
            "description_de": "Fahrten von/zum Flughafen Stuttgart aus dem Umland",
            "description_en": "Transfers to/from Stuttgart Airport from the surrounding area",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Stuttgart Hauptbahnhof",
                    "from_en": "Stuttgart Main Station",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "39.00",
                    "note_de": "Pauschalpreis",
                    "note_en": "Price",
                },
                {
                    "sort_order": 20,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "45.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 30,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "49.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 40,
                    "from_de": "Plochingen",
                    "from_en": "Plochingen",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "55.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 50,
                    "from_de": "Göppingen",
                    "from_en": "Göppingen",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "75.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 60,
                    "from_de": "Tübingen",
                    "from_en": "Tübingen",
                    "to_de": "Flughafen Stuttgart",
                    "to_en": "Stuttgart Airport",
                    "price": "85.00",
                    "note_de": None,
                    "note_en": None,
                },
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Flughafen Frankfurt (FRA)",
            "name_en": "Frankfurt Airport (FRA)",
            "description_de": "Lange Strecke zum Drehkreuz Frankfurt",
            "description_en": "Long-distance transfers to the Frankfurt hub",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Stuttgart",
                    "from_en": "Stuttgart",
                    "to_de": "Flughafen Frankfurt",
                    "to_en": "Frankfurt Airport",
                    "price": "320.00",
                    "note_de": "ca. 2 Stunden Fahrt",
                    "note_en": "approx. 2 hours travel",
                },
                {
                    "sort_order": 20,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "Flughafen Frankfurt",
                    "to_en": "Frankfurt Airport",
                    "price": "330.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 30,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Flughafen Frankfurt",
                    "to_en": "Frankfurt Airport",
                    "price": "340.00",
                    "note_de": None,
                    "note_en": None,
                },
            ],
        },
        {
            "sort_order": 30,
            "name_de": "Flughafen München (MUC)",
            "name_en": "Munich Airport (MUC)",
            "description_de": "Fahrten zum Flughafen München",
            "description_en": "Transfers to Munich Airport",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Stuttgart",
                    "from_en": "Stuttgart",
                    "to_de": "Flughafen München",
                    "to_en": "Munich Airport",
                    "price": "380.00",
                    "note_de": "ca. 2,5 Stunden Fahrt",
                    "note_en": "approx. 2.5 hours travel",
                },
                {
                    "sort_order": 20,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "Flughafen München",
                    "to_en": "Munich Airport",
                    "price": "390.00",
                    "note_de": None,
                    "note_en": None,
                },
            ],
        },
    ],
    "krankenhausfahrten": [
        {
            "sort_order": 10,
            "name_de": "Klinikum Esslingen",
            "name_en": "Esslingen Hospital",
            "description_de": "Fahrten zum und vom Klinikum Esslingen am Neckar",
            "description_en": "Trips to and from Klinikum Esslingen",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Esslingen Innenstadt",
                    "from_en": "Esslingen city centre",
                    "to_de": "Klinikum Esslingen",
                    "to_en": "Esslingen Hospital",
                    "price": "18.00",
                    "note_de": "inkl. Wartezeit am Eingang",
                    "note_en": "Includes wait at entrance",
                },
                {
                    "sort_order": 20,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Klinikum Esslingen",
                    "to_en": "Esslingen Hospital",
                    "price": "22.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 30,
                    "from_de": "Plochingen",
                    "from_en": "Plochingen",
                    "to_de": "Klinikum Esslingen",
                    "to_en": "Esslingen Hospital",
                    "price": "28.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 40,
                    "from_de": "Wendlingen",
                    "from_en": "Wendlingen",
                    "to_de": "Klinikum Esslingen",
                    "to_en": "Esslingen Hospital",
                    "price": "32.00",
                    "note_de": None,
                    "note_en": None,
                },
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Stuttgarter Kliniken",
            "name_en": "Stuttgart Hospitals",
            "description_de": "Klinikum Stuttgart, Marienhospital, Robert-Bosch-Krankenhaus, BG-Unfallklinik",
            "description_en": "Klinikum Stuttgart, Marienhospital, Robert-Bosch-Krankenhaus, BG-Unfallklinik",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Klinikum Stuttgart (Mitte)",
                    "to_en": "Klinikum Stuttgart (Mitte)",
                    "price": "42.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 20,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Marienhospital Stuttgart",
                    "to_en": "Marienhospital Stuttgart",
                    "price": "45.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 30,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Robert-Bosch-Krankenhaus",
                    "to_en": "Robert-Bosch-Krankenhaus",
                    "price": "48.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 40,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "Klinikum Stuttgart (Mitte)",
                    "to_en": "Klinikum Stuttgart (Mitte)",
                    "price": "38.00",
                    "note_de": None,
                    "note_en": None,
                },
                {
                    "sort_order": 50,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "BG-Unfallklinik Tübingen",
                    "to_en": "BG Trauma Clinic Tübingen",
                    "price": "85.00",
                    "note_de": None,
                    "note_en": None,
                },
            ],
        },
    ],
    "schuelerbefoerderung": [
        {
            "sort_order": 10,
            "name_de": "Tägliche Schulfahrten",
            "name_en": "Daily School Runs",
            "description_de": "Monatspreise für tägliche Schulwege (Hin- und Rückfahrt, Schultage)",
            "description_en": "Monthly prices for daily school runs (round-trip, school days)",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Gymnasium Esslingen",
                    "to_en": "Esslingen Gymnasium",
                    "price": "180.00",
                    "note_de": "monatlich, inkl. Hin- und Rückfahrt",
                    "note_en": "Monthly, includes outbound and return",
                },
                {
                    "sort_order": 20,
                    "from_de": "Plochingen",
                    "from_en": "Plochingen",
                    "to_de": "Gymnasium Esslingen",
                    "to_en": "Esslingen Gymnasium",
                    "price": "240.00",
                    "note_de": "monatlich, inkl. Hin- und Rückfahrt",
                    "note_en": "Monthly, includes outbound and return",
                },
                {
                    "sort_order": 30,
                    "from_de": "Esslingen",
                    "from_en": "Esslingen",
                    "to_de": "Stuttgarter Gymnasium",
                    "to_en": "Stuttgart Gymnasium",
                    "price": "320.00",
                    "note_de": "monatlich, inkl. Hin- und Rückfahrt",
                    "note_en": "Monthly, includes outbound and return",
                },
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Einzelfahrten",
            "name_en": "Single Rides",
            "description_de": "Für gelegentliche Fahrten oder Vertretung",
            "description_en": "For occasional rides or substitution",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Deizisau",
                    "from_en": "Deizisau",
                    "to_de": "Schule in Esslingen",
                    "to_en": "Esslingen school",
                    "price": "18.00",
                    "note_de": "Einzelfahrt",
                    "note_en": "Single ride",
                },
                {
                    "sort_order": 20,
                    "from_de": "Plochingen",
                    "from_en": "Plochingen",
                    "to_de": "Schule in Esslingen",
                    "to_en": "Esslingen school",
                    "price": "24.00",
                    "note_de": "Einzelfahrt",
                    "note_en": "Single ride",
                },
            ],
        },
    ],
    "shuttle-service": [
        {
            "sort_order": 10,
            "name_de": "Stunden-Pauschalen",
            "name_en": "Hourly Rates",
            "description_de": "Für Veranstaltungen mit längerer Wartezeit oder mehreren Fahrten",
            "description_en": "For events with longer wait times or multiple trips",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Sedan (bis 3 Personen)",
                    "from_en": "Sedan (up to 3 passengers)",
                    "to_de": "Stundenpreis",
                    "to_en": "Hourly rate",
                    "price": "65.00",
                    "note_de": "pro Stunde, mind. 3 Std.",
                    "note_en": "Per hour, min. 3 hrs",
                },
                {
                    "sort_order": 20,
                    "from_de": "Van (bis 8 Personen)",
                    "from_en": "Van (up to 8 passengers)",
                    "to_de": "Stundenpreis",
                    "to_en": "Hourly rate",
                    "price": "85.00",
                    "note_de": "pro Stunde, mind. 3 Std.",
                    "note_en": "Per hour, min. 3 hrs",
                },
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Hochzeits-Pakete",
            "name_en": "Wedding Packages",
            "description_de": "Pauschalpreis für den Hochzeitstag",
            "description_en": "Prices for the wedding day",
            "items": [
                {
                    "sort_order": 10,
                    "from_de": "Halbtages-Paket",
                    "from_en": "Half-day package",
                    "to_de": "4 Stunden, ein Fahrzeug",
                    "to_en": "4 hours, one vehicle",
                    "price": "320.00",
                    "note_de": "Pauschalpreis",
                    "note_en": "Price",
                },
                {
                    "sort_order": 20,
                    "from_de": "Tages-Paket",
                    "from_en": "Full-day package",
                    "to_de": "8 Stunden, ein Fahrzeug",
                    "to_en": "8 hours, one vehicle",
                    "price": "580.00",
                    "note_de": "Pauschalpreis",
                    "note_en": "Price",
                },
            ],
        },
    ],
}


def run() -> None:
    log_section("Pricing (categories + items)")
    db = SessionLocal()
    try:
        from app.Models.services import Service
        from app.Models.pricing import PricingCategory
        from app.Services.PricingService import PricingService

        actor = get_system_actor(db)
        total_cats_created = 0
        total_items_created = 0
        total_cats_skipped = 0
        for service_slug, categories in PRICING_DATA.items():
            svc = (
                db.query(Service)
                .filter(Service.slug_de == service_slug, Service.is_deleted == False)
                .first()
            )
            if not svc:
                print(
                    f"  [warn] service '{service_slug}' not found — run seed_services first"
                )
                continue
            for cat_data in categories:
                existing_cat = (
                    db.query(PricingCategory)
                    .filter(
                        PricingCategory.service_id == svc.id,
                        PricingCategory.name_de == cat_data["name_de"],
                    )
                    .first()
                )
                if existing_cat:
                    log_skip(
                        f"category '{cat_data['name_de']}'",
                        f"under service '{service_slug}'",
                    )
                    total_cats_skipped += 1
                    continue
                cat = PricingService.create_category(
                    db,
                    svc.id,
                    {
                        "sort_order": cat_data["sort_order"],
                        "name_de": cat_data["name_de"],
                        "name_en": cat_data["name_en"],
                        "description_de": cat_data["description_de"],
                        "description_en": cat_data["description_en"],
                    },
                    actor,
                    request=None,
                )
                total_cats_created += 1
                log_create(f"category '{cat.name_de}'", f"under '{service_slug}'")
                for item_data in cat_data["items"]:
                    PricingService.create_item(
                        db,
                        cat.id,
                        {
                            "sort_order": item_data["sort_order"],
                            "from_location_de": item_data["from_de"],
                            "from_location_en": item_data["from_en"],
                            "to_location_de": item_data["to_de"],
                            "to_location_en": item_data["to_en"],
                            "price_eur": Decimal(item_data["price"]),
                            "note_de": item_data["note_de"],
                            "note_en": item_data["note_en"],
                        },
                        actor,
                        request=None,
                    )
                    total_items_created += 1
        print(
            f"  [done] {total_cats_created} categories created ({total_cats_skipped} skipped), {total_items_created} items created"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
