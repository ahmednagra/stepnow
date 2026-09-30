# apps/backend/scripts/seeders/seed_pricing.py
# Seeds the public price list. Every figure mirrors the printed campaign material — the A5 flyer
# (StepNow_Flyer_A5.pdf) and the Preisliste "Stand: 20.09.2026" (Step_NowPreis.pdf). Where the two
# disagree the FLYER wins, because it is what customers hold in their hand:
#   · Kilometerpreis 2,30 €/km flat (the Preisliste's 2,40 €/km ≤ 50 km is superseded)
#   · Esslingen a. N. → Hauptbahnhof Stuttgart 50,00 € (Preisliste: 60,00 €)
# Towns the flyer doesn't list come from the Preisliste unchanged.
#
# Passenger prices are Endpreise incl. statutory VAT, per vehicle, one way, up to 4 persons.
# Courier prices are net (prices_net=True) plus statutory VAT.
# price=None renders as "Preis auf Anfrage": the offering is real, the fare is quoted per request.
#
# Depends on seed_services (looked up by slug_de). Idempotent: categories keyed by
# (service_id, name_de) — existing categories are skipped. Categories named in RETIRED_CATEGORIES
# (the pre-flyer price list) are soft-deleted so an existing database converges on the flyer.

from decimal import Decimal

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


def _item(sort, from_de, from_en, price, *, to_de=None, to_en=None, unit=None, from_price=False,
          note_de=None, note_en=None):
    return {
        "sort_order": sort,
        "from_location_de": from_de, "from_location_en": from_en,
        "to_location_de": to_de, "to_location_en": to_en,
        "price_eur": Decimal(price) if price is not None else None,
        "price_unit": unit, "is_from_price": from_price,
        "note_de": note_de, "note_en": note_en,
    }


# (town_de, town_en, airport_price, hbf_price) — Preisliste §4, flyer overrides applied.
FIXED_ROUTES = [
    ("Aichwald", "Aichwald", "59.00", "64.00"),
    ("Altbach / Deizisau", "Altbach / Deizisau", "44.00", "49.00"),
    ("Ebersbach a. F.", "Ebersbach an der Fils", "65.00", "70.00"),
    ("Esslingen a. N.", "Esslingen am Neckar", "50.00", "50.00"),
    ("Köngen", "Köngen", "39.00", "49.00"),
    ("Plochingen", "Plochingen", "44.00", "49.00"),
    ("Reichenbach a. F. / Hochdorf", "Reichenbach an der Fils / Hochdorf", "50.00", "60.00"),
    ("Wendlingen a. N.", "Wendlingen am Neckar", "39.00", "49.00"),
    ("Wernau", "Wernau", "44.00", "49.00"),
]

ON_REQUEST_DE = "Individuelles Angebot — den Preis nennen wir Ihnen vorab."
ON_REQUEST_EN = "Individual quote — we confirm the price in advance."

PRICING_DATA = {
    "flughafentransfer": [
        {
            "sort_order": 10,
            "name_de": "Festpreise zum Flughafen Stuttgart",
            "name_en": "Fixed prices to Stuttgart Airport",
            "description_de": "Ab Ihrem Wohnort, pro Fahrzeug und einfacher Fahrt, bis zu 4 Personen.",
            "description_en": "From your home town, per vehicle and one way, up to 4 persons.",
            "items": [
                _item(10 * (i + 1), de, en, airport, to_de="Flughafen Stuttgart", to_en="Stuttgart Airport")
                for i, (de, en, airport, _hbf) in enumerate(FIXED_ROUTES)
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Festpreise zum Hauptbahnhof Stuttgart",
            "name_en": "Fixed prices to Stuttgart Central Station",
            "description_de": "Ab Ihrem Wohnort, pro Fahrzeug und einfacher Fahrt, bis zu 4 Personen.",
            "description_en": "From your home town, per vehicle and one way, up to 4 persons.",
            "items": [
                _item(10 * (i + 1), de, en, hbf, to_de="Hauptbahnhof Stuttgart", to_en="Stuttgart Central Station")
                for i, (de, en, _airport, hbf) in enumerate(FIXED_ROUTES)
            ],
        },
        {
            "sort_order": 30,
            "name_de": "Weitere Flughäfen",
            "name_en": "Other airports",
            "description_de": "Fernfahrten zu weiteren Flughäfen fahren wir gern — den Preis nennen wir Ihnen vorab.",
            "description_en": "We are happy to drive you to other airports — we quote the price in advance.",
            "items": [
                _item(10, "Flughafen Frankfurt (FRA)", "Frankfurt Airport (FRA)", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
                _item(20, "Flughafen München (MUC)", "Munich Airport (MUC)", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
                _item(30, "Flughafen Memmingen (FMM)", "Memmingen Airport (FMM)", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
                _item(40, "Flughafen Karlsruhe/Baden-Baden (FKB)", "Karlsruhe/Baden-Baden Airport (FKB)", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
            ],
        },
    ],
    "shuttle-service": [
        {
            "sort_order": 10,
            "name_de": "Tarif — Fahrten nach Kilometern",
            "name_en": "Tariff — distance-based rides",
            "description_de": "Anfahrt plus gefahrene Kilometer, pro Fahrzeug und einfacher Fahrt, bis zu 4 Personen.",
            "description_en": "Call-out charge plus kilometres driven, per vehicle and one way, up to 4 persons.",
            "items": [
                _item(10, "Anfahrt (Grundpreis)", "Call-out charge (base price)", "2.99"),
                _item(20, "Kilometerpreis", "Price per kilometre", "2.30", unit="km"),
                _item(30, "Wartezeit", "Waiting time", "0.35", unit="min"),
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Beispielpreise (Anfahrt + Kilometer)",
            "name_en": "Example prices (call-out + kilometres)",
            "description_de": "So setzt sich Ihr Fahrpreis zusammen — ohne Wartezeit.",
            "description_en": "How your fare adds up — waiting time not included.",
            "items": [
                _item(10, "5 km", "5 km", "14.49"),
                _item(20, "10 km", "10 km", "25.99"),
                _item(30, "15 km", "15 km", "37.49"),
                _item(40, "20 km", "20 km", "48.99"),
                _item(50, "30 km", "30 km", "71.99"),
            ],
        },
        {
            "sort_order": 30,
            "name_de": "Stadtfahrt — Bahnhof / Einkaufen",
            "name_en": "Local ride — station / shopping",
            "description_de": "Festpreis für Fahrten bis 3 km innerhalb des Ortes.",
            "description_en": "Fixed price for rides up to 3 km within the town.",
            "items": [
                _item(10, "Deizisau", "Deizisau", "9.99"),
                _item(20, "Altbach", "Altbach", "14.99"),
                _item(30, "Plochingen", "Plochingen", "19.99"),
            ],
        },
        {
            "sort_order": 40,
            "name_de": "Gruppen- & Eventfahrten",
            "name_en": "Group & event transport",
            "description_de": "Für mehr als 4 Personen setzen wir mehrere Fahrzeuge ein und stimmen den Ablauf mit Ihnen ab.",
            "description_en": "For more than 4 persons we deploy several vehicles and plan the schedule with you.",
            "items": [
                _item(10, "Hochzeiten & Familienfeiern", "Weddings & family celebrations", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
                _item(20, "Firmenfeiern, Tagungen & Messen", "Company events, conferences & trade fairs", None, note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
            ],
        },
    ],
    "krankenhausfahrten": [
        {
            "sort_order": 10,
            "name_de": "Fahrten zu Arztpraxen, Kliniken & Reha",
            "name_en": "Rides to doctors, clinics & rehab",
            "description_de": "Berechnet nach unserem Tarif (Anfahrt + Kilometer + Wartezeit). Auf Wunsch nennen wir Ihnen vorab einen Festpreis.",
            "description_en": "Charged at our tariff (call-out + kilometres + waiting time). On request we quote a fixed price in advance.",
            "items": [
                _item(10, "Arzt- und Facharzttermine", "Doctor and specialist appointments", None,
                      note_de="Nach Tarif oder Festpreis auf Anfrage.", note_en="At our tariff or fixed price on request."),
                _item(20, "Kliniken der Region (z. B. Klinikum Esslingen, Stuttgarter Kliniken)",
                      "Regional hospitals (e.g. Klinikum Esslingen, Stuttgart hospitals)", None,
                      note_de="Nach Tarif oder Festpreis auf Anfrage.", note_en="At our tariff or fixed price on request."),
                _item(30, "Reha-Kliniken & längere Strecken", "Rehab clinics & longer distances", None,
                      note_de=ON_REQUEST_DE, note_en=ON_REQUEST_EN),
            ],
        },
    ],
    "kurier-sondertransport": [
        {
            "sort_order": 10,
            "name_de": "PKW / Kombi",
            "name_en": "Car / estate",
            "description_de": "Grundpreis inkl. 5 km und 1 Std. Be-/Entladezeit. Preise netto, zzgl. gesetzlicher MwSt.",
            "description_en": "Base price incl. 5 km and 1 hour of loading/unloading. Net prices, plus statutory VAT.",
            "prices_net": True,
            "items": [
                _item(10, "Grundpreis", "Base price", "40.00", from_price=True),
                _item(20, "Kilometerpreis", "Price per kilometre", "1.30", unit="km"),
                _item(30, "Wartezeit", "Waiting time", "0.35", unit="min"),
                _item(40, "Beispiel 10 km", "Example 10 km", "46.50"),
                _item(50, "Beispiel 30 km", "Example 30 km", "72.50"),
                _item(60, "Beispiel 100 km", "Example 100 km", "163.50"),
            ],
        },
        {
            "sort_order": 20,
            "name_de": "Sprinter (Koffer)",
            "name_en": "Sprinter (box van)",
            "description_de": "Grundpreis inkl. 5 km und 1 Std. Be-/Entladezeit. Preise netto, zzgl. gesetzlicher MwSt.",
            "description_en": "Base price incl. 5 km and 1 hour of loading/unloading. Net prices, plus statutory VAT.",
            "prices_net": True,
            "items": [
                _item(10, "Grundpreis", "Base price", "50.00", from_price=True),
                _item(20, "Kilometerpreis", "Price per kilometre", "1.45", unit="km"),
                _item(30, "Wartezeit", "Waiting time", "0.45", unit="min"),
                _item(40, "Beispiel 10 km", "Example 10 km", "57.25"),
                _item(50, "Beispiel 30 km", "Example 30 km", "86.25"),
                _item(60, "Beispiel 100 km", "Example 100 km", "187.75"),
            ],
        },
        {
            "sort_order": 30,
            "name_de": "Zuschläge & Fernstrecken",
            "name_en": "Surcharges & long distance",
            "description_de": "Preise netto, zzgl. gesetzlicher MwSt.",
            "description_en": "Net prices, plus statutory VAT.",
            "prices_net": True,
            "items": [
                _item(10, "Express-/Sonderfahrt-Zuschlag", "Express / special-trip surcharge", "25.00",
                      note_de="Zusätzlich zum Fahrpreis.", note_en="In addition to the fare."),
                _item(20, "Strecken über 150 km", "Distances over 150 km", None,
                      note_de="Preis nach Absprache.", note_en="Price by arrangement."),
            ],
        },
    ],
}

# The pre-flyer price list. Soft-deleted on every run so an existing database shows only flyer prices.
RETIRED_CATEGORIES = {
    "flughafentransfer": ["Flughafen Stuttgart (STR)", "Flughafen Frankfurt (FRA)", "Flughafen München (MUC)"],
    "krankenhausfahrten": ["Klinikum Esslingen", "Stuttgarter Kliniken"],
    "schuelerbefoerderung": ["Tägliche Schulfahrten", "Einzelfahrten"],
    "shuttle-service": ["Stunden-Pauschalen", "Hochzeits-Pakete"],
}


def run() -> None:
    log_section("Pricing (categories + items)")
    db = SessionLocal()
    try:
        from app.Models.services import Service
        from app.Models.pricing import PricingCategory
        from app.Services.PricingService import PricingService

        actor = get_system_actor(db)

        retired = 0
        for service_slug, names in RETIRED_CATEGORIES.items():
            svc = db.query(Service).filter(Service.slug_de == service_slug).first()
            if not svc:
                continue
            for cat in db.query(PricingCategory).filter(
                PricingCategory.service_id == svc.id,
                PricingCategory.name_de.in_(names),
                PricingCategory.is_deleted == False,
            ):
                PricingService.soft_delete_category(db, cat.id, actor, request=None)
                retired += 1

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
                print(f"  [warn] service '{service_slug}' not found — run seed_services first")
                continue
            for cat_data in categories:
                existing_cat = (
                    db.query(PricingCategory)
                    .filter(
                        PricingCategory.service_id == svc.id,
                        PricingCategory.name_de == cat_data["name_de"],
                        PricingCategory.is_deleted == False,
                    )
                    .first()
                )
                if existing_cat:
                    log_skip(f"category '{cat_data['name_de']}'", f"under service '{service_slug}'")
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
                        "prices_net": cat_data.get("prices_net", False),
                    },
                    actor,
                    request=None,
                )
                total_cats_created += 1
                log_create(f"category '{cat.name_de}'", f"under '{service_slug}'")
                for item_data in cat_data["items"]:
                    PricingService.create_item(db, cat.id, dict(item_data), actor, request=None)
                    total_items_created += 1
        print(
            f"  [done] {total_cats_created} categories created ({total_cats_skipped} skipped), "
            f"{total_items_created} items created, {retired} retired"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
