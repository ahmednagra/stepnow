# apps/backend/tests/test_pricing_seed.py
# The public price list must match the printed campaign material (StepNow_Flyer_A5.pdf, with the
# Preisliste "Stand 20.09.2026" for towns the flyer omits). These tests pin the seed to those
# figures and check the example prices are consistent with the tariff they illustrate — a changed
# rate without changed examples (or vice versa) fails here, not on a customer's flyer comparison.
# Pure data checks: no database.

from decimal import Decimal

from scripts.seeders.seed_pricing import FIXED_ROUTES, PRICING_DATA, RETIRED_CATEGORIES
from scripts.seeders.seed_services import RETIRED_SLUGS, SERVICES


def _category(service_slug: str, name_de: str) -> dict:
    return next(c for c in PRICING_DATA[service_slug] if c["name_de"] == name_de)


def _items(service_slug: str, name_de: str) -> dict[str, dict]:
    return {i["from_location_de"]: i for i in _category(service_slug, name_de)["items"]}


def test_services_are_exactly_the_flyer_four():
    titles = [s["title_de"] for s in sorted(SERVICES, key=lambda s: s["sort_order"])]
    assert titles == ["Flughafen-Transfer", "Shuttle Service", "Arzt- & Klinikfahrten", "Express-Kurier & Terminfracht"]
    assert "schuelerbefoerderung" in RETIRED_SLUGS
    assert set(PRICING_DATA) == {s["slug_de"] for s in SERVICES}


def test_passenger_tariff_matches_flyer():
    tariff = _items("shuttle-service", "Tarif — Fahrten nach Kilometern")
    assert tariff["Anfahrt (Grundpreis)"]["price_eur"] == Decimal("2.99")
    assert tariff["Kilometerpreis"]["price_eur"] == Decimal("2.30")  # flyer wins over the Preisliste's 2,40
    assert tariff["Kilometerpreis"]["price_unit"] == "km"
    assert tariff["Wartezeit"]["price_eur"] == Decimal("0.35")
    assert tariff["Wartezeit"]["price_unit"] == "min"


def test_passenger_examples_follow_the_tariff():
    tariff = _items("shuttle-service", "Tarif — Fahrten nach Kilometern")
    base, per_km = tariff["Anfahrt (Grundpreis)"]["price_eur"], tariff["Kilometerpreis"]["price_eur"]
    examples = _items("shuttle-service", "Beispielpreise (Anfahrt + Kilometer)")
    printed = {"5 km": "14.49", "10 km": "25.99", "15 km": "37.49", "20 km": "48.99", "30 km": "71.99"}
    assert {k: str(v["price_eur"]) for k, v in examples.items()} == printed
    for label, item in examples.items():
        km = Decimal(label.split()[0])
        assert item["price_eur"] == base + per_km * km, label


def test_local_ride_prices():
    local = _items("shuttle-service", "Stadtfahrt — Bahnhof / Einkaufen")
    assert {k: str(v["price_eur"]) for k, v in local.items()} == {"Deizisau": "9.99", "Altbach": "14.99", "Plochingen": "19.99"}


def test_fixed_airport_and_station_prices():
    airport = {i["from_location_de"]: str(i["price_eur"]) for i in _category("flughafentransfer", "Festpreise zum Flughafen Stuttgart")["items"]}
    station = {i["from_location_de"]: str(i["price_eur"]) for i in _category("flughafentransfer", "Festpreise zum Hauptbahnhof Stuttgart")["items"]}
    assert airport == {
        "Aichwald": "59.00", "Altbach / Deizisau": "44.00", "Ebersbach a. F.": "65.00", "Esslingen a. N.": "50.00",
        "Köngen": "39.00", "Plochingen": "44.00", "Reichenbach a. F. / Hochdorf": "50.00", "Wendlingen a. N.": "39.00",
        "Wernau": "44.00",
    }
    assert station == {
        "Aichwald": "64.00", "Altbach / Deizisau": "49.00", "Ebersbach a. F.": "70.00",
        "Esslingen a. N.": "50.00",  # flyer wins over the Preisliste's 60,00
        "Köngen": "49.00", "Plochingen": "49.00", "Reichenbach a. F. / Hochdorf": "60.00", "Wendlingen a. N.": "49.00",
        "Wernau": "49.00",
    }
    assert len(FIXED_ROUTES) == 9


def test_courier_prices_are_net_and_examples_follow_the_tariff():
    for name, base, per_km, wait, printed in (
        ("PKW / Kombi", "40.00", "1.30", "0.35", {"10": "46.50", "30": "72.50", "100": "163.50"}),
        ("Sprinter (Koffer)", "50.00", "1.45", "0.45", {"10": "57.25", "30": "86.25", "100": "187.75"}),
    ):
        cat = _category("kurier-sondertransport", name)
        assert cat["prices_net"] is True
        items = {i["from_location_de"]: i for i in cat["items"]}
        assert items["Grundpreis"]["price_eur"] == Decimal(base) and items["Grundpreis"]["is_from_price"]
        assert items["Kilometerpreis"]["price_eur"] == Decimal(per_km)
        assert items["Wartezeit"]["price_eur"] == Decimal(wait)
        for km, price in printed.items():
            example = items[f"Beispiel {km} km"]["price_eur"]
            assert example == Decimal(price)
            # Grundpreis includes the first 5 km.
            assert example == Decimal(base) + Decimal(per_km) * (Decimal(km) - 5)
    extras = _items("kurier-sondertransport", "Zuschläge & Fernstrecken")
    assert extras["Express-/Sonderfahrt-Zuschlag"]["price_eur"] == Decimal("25.00")
    assert extras["Strecken über 150 km"]["price_eur"] is None


def test_offerings_without_a_printed_price_are_on_request():
    for slug, names in (("flughafentransfer", ["Weitere Flughäfen"]), ("shuttle-service", ["Gruppen- & Eventfahrten"]),
                        ("krankenhausfahrten", ["Fahrten zu Arztpraxen, Kliniken & Reha"])):
        for name in names:
            assert all(i["price_eur"] is None for i in _category(slug, name)["items"]), name


def test_pre_flyer_price_list_is_retired_not_reseeded():
    seeded = {c["name_de"] for cats in PRICING_DATA.values() for c in cats}
    retired = {n for names in RETIRED_CATEGORIES.values() for n in names}
    assert not seeded & retired
