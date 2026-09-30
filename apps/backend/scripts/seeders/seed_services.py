# apps/backend/scripts/seeders/seed_services.py
# Seeds the four StepNow services exactly as the campaign flyer (StepNow_Flyer_A5.pdf) names them —
# Flughafen-Transfer, Shuttle Service, Arzt- & Klinikfahrten, Express-Kurier & Terminfracht — with
# bilingual content: DE/EN slugs, titles and descriptions, a Markdown long_description and SEO meta.
# Copy states only what the flyer and Preisliste support; the prices themselves live in seed_pricing.
#
# Keyed by the original slug_de, stored as services.seed_key, so an admin renaming a slug does not
# make the seeder create a duplicate. Managed seed (see _base.py): a service is brought in line
# with this file only while it is unedited since seeding; one an admin edited is kept as is.
# Services in RETIRED_SLUGS are no longer offered and are set inactive (kept for existing booking
# references) — again only when unedited, so a service an admin re-activated stays active.

from decimal import Decimal  # noqa: E402

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, human_edited_ids, is_unedited, log_create, log_kept, log_section, reconcile, seed_fingerprint  # noqa: E402


SERVICES = [
    {
        "sort_order": 10,
        "active": True,
        "icon": "plane",
        "vat_rate": Decimal("0.0700"),
        "slug_de": "flughafentransfer",
        "slug_en": "airport-transfer",
        "title_de": "Flughafen-Transfer",
        "title_en": "Airport Transfer",
        "short_description_de": "Festpreise zum Flughafen und Hauptbahnhof Stuttgart — pünktlich, vorbestellt, bis zu 4 Personen.",
        "short_description_en": "Fixed prices to Stuttgart Airport and Central Station — punctual, pre-booked, up to 4 persons.",
        "long_description_de": (
            "## Flughafen-Transfer — zum Festpreis ab Ihrem Wohnort\n\n"
            "Wir bringen Sie pünktlich zum **Flughafen Stuttgart** oder zum **Hauptbahnhof Stuttgart** — "
            "zu festen Preisen ab Aichwald, Altbach/Deizisau, Ebersbach, Esslingen, Köngen, Plochingen, "
            "Reichenbach/Hochdorf, Wendlingen und Wernau.\n\n"
            "### Was uns auszeichnet\n\n"
            "- **Festpreis pro Fahrzeug** — gilt für bis zu 4 Personen und je einfache Fahrt\n"
            "- **Vorbestellt** — Ihr Fahrer ist zur vereinbarten Zeit vor Ort\n"
            "- **Flugverfolgung** — bei Abholungen stimmen wir die Zeit auf Ihre tatsächliche Landung ab\n"
            "- **Gepäckhilfe** — wir helfen beim Ein- und Ausladen\n"
            "- **Rückfahrt mit Rabatt** — fahren Sie innerhalb einer Stunde mit uns zurück, erhalten Sie 10 % Rabatt auf die Rückfahrt\n\n"
            "### Weitere Flughäfen\n\n"
            "Frankfurt, München, Memmingen oder Karlsruhe/Baden-Baden fahren wir ebenfalls — "
            "den Preis nennen wir Ihnen vorab auf Anfrage."
        ),
        "long_description_en": (
            "## Airport Transfer — fixed prices from your home town\n\n"
            "We take you punctually to **Stuttgart Airport** or **Stuttgart Central Station** — at fixed prices "
            "from Aichwald, Altbach/Deizisau, Ebersbach, Esslingen, Köngen, Plochingen, Reichenbach/Hochdorf, "
            "Wendlingen and Wernau.\n\n"
            "### What sets us apart\n\n"
            "- **Fixed price per vehicle** — valid for up to 4 persons, per one-way trip\n"
            "- **Pre-booked** — your driver is there at the agreed time\n"
            "- **Flight tracking** — for pickups we match the time to your actual landing\n"
            "- **Luggage assistance** — we help with loading and unloading\n"
            "- **Discounted return** — ride back with us within one hour and get 10% off the return trip\n\n"
            "### Other airports\n\n"
            "We also drive to Frankfurt, Munich, Memmingen or Karlsruhe/Baden-Baden — "
            "we quote the price in advance on request."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Flughafen-Transfer Stuttgart — Festpreise ab Wohnort",
        "meta_title_en": "Airport Transfer Stuttgart — Fixed Prices from Your Town",
        "meta_description_de": "Festpreise zum Flughafen und Hauptbahnhof Stuttgart ab Esslingen, Plochingen, Deizisau und Umgebung. Pro Fahrzeug bis 4 Personen, inkl. MwSt. Personenbeförderung nach § 49 PBefG.",
        "meta_description_en": "Fixed prices to Stuttgart Airport and Central Station from Esslingen, Plochingen, Deizisau and the region. Per vehicle up to 4 persons, VAT included. Licensed under § 49 PBefG.",
    },
    {
        "sort_order": 20,
        "active": True,
        "icon": "users",
        "vat_rate": Decimal("0.0700"),
        "slug_de": "shuttle-service",
        "slug_en": "shuttle-service",
        "title_de": "Shuttle Service",
        "title_en": "Shuttle Service",
        "short_description_de": "Stadtfahrten, Bahnhof und Einkauf, Fahrten nach Kilometern und Gruppen-Shuttles — vorbestellt und transparent.",
        "short_description_en": "Local rides, station and shopping trips, distance-based rides and group shuttles — pre-booked and transparent.",
        "long_description_de": (
            "## Shuttle Service — transparent nach Tarif\n\n"
            "Ob zum Bahnhof, zum Einkaufen oder quer durch die Region: Sie zahlen die Anfahrt und die gefahrenen "
            "Kilometer — sonst nichts. Für kurze Stadtfahrten bis 3 km gelten feste Preise.\n\n"
            "### So fahren Sie mit uns\n\n"
            "- **Stadtfahrt zum Festpreis** — Deizisau, Altbach und Plochingen bis 3 km\n"
            "- **Fahrten nach Kilometern** — Anfahrt plus Kilometerpreis, Wartezeit nach Minuten\n"
            "- **Bis zu 4 Personen pro Fahrzeug** — der Preis gilt pro Fahrzeug, nicht pro Person\n"
            "- **Gruppen und Events** — für größere Gruppen setzen wir mehrere Fahrzeuge ein\n"
            "- **Online vorbestellen** — bis zu 5 % Rabatt bei Online-Buchung\n\n"
            "### Typische Anlässe\n\n"
            "Fahrten zum Bahnhof, Einkäufe, Behördengänge, Hochzeiten und Familienfeiern, "
            "Firmenfeiern, Tagungen und Messen."
        ),
        "long_description_en": (
            "## Shuttle Service — transparent tariff\n\n"
            "Whether to the station, shopping or across the region: you pay the call-out charge and the kilometres "
            "driven — nothing else. Short local rides up to 3 km have fixed prices.\n\n"
            "### How you ride with us\n\n"
            "- **Local rides at a fixed price** — Deizisau, Altbach and Plochingen up to 3 km\n"
            "- **Distance-based rides** — call-out charge plus price per kilometre, waiting time per minute\n"
            "- **Up to 4 persons per vehicle** — the price is per vehicle, not per person\n"
            "- **Groups and events** — for larger groups we deploy several vehicles\n"
            "- **Book online** — up to 5% discount on online bookings\n\n"
            "### Typical occasions\n\n"
            "Rides to the station, shopping, appointments at public offices, weddings and family celebrations, "
            "company events, conferences and trade fairs."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Shuttle Service Esslingen & Plochingen — Stadtfahrten und Tarif",
        "meta_title_en": "Shuttle Service Esslingen & Plochingen — Local Rides and Tariff",
        "meta_description_de": "Stadtfahrten ab 9,99 €, Fahrten nach Kilometern und Gruppen-Shuttles in Deizisau, Plochingen, Esslingen und Umgebung. Bis 4 Personen pro Fahrzeug, alle Preise inkl. MwSt.",
        "meta_description_en": "Local rides from €9.99, distance-based rides and group shuttles in Deizisau, Plochingen, Esslingen and the region. Up to 4 persons per vehicle, all prices incl. VAT.",
    },
    {
        "sort_order": 30,
        "active": True,
        "icon": "heart-pulse",
        "vat_rate": Decimal("0.0700"),
        "slug_de": "krankenhausfahrten",
        "slug_en": "hospital-transport",
        "title_de": "Arzt- & Klinikfahrten",
        "title_en": "Doctor & Clinic Rides",
        "short_description_de": "Sichere, geduldige Fahrten zu Arztpraxen, Kliniken und Reha-Terminen — Tür zu Tür.",
        "short_description_en": "Safe, patient rides to doctors, clinics and rehab appointments — door to door.",
        "long_description_de": (
            "## Arzt- & Klinikfahrten — Würde und Sicherheit\n\n"
            "Arzttermine, Klinikaufenthalte und Reha sind belastend genug. Wir nehmen Ihnen die Sorge um die Anreise ab — "
            "pünktlich, würdevoll und mit der Geduld, die ein medizinischer Termin verlangt.\n\n"
            "### Was wir bieten\n\n"
            "- **Tür-zu-Tür-Service** — wir helfen beim Ein- und Aussteigen\n"
            "- **Geduld bei längeren Vorbereitungen** — kein gehetztes Gefühl\n"
            "- **Begleitperson willkommen** — der Preis gilt pro Fahrzeug (bis zu 4 Personen)\n"
            "- **Kliniken der Region** — Klinikum Esslingen, Stuttgarter Kliniken und Reha-Einrichtungen\n\n"
            "### Preis und Rechnung\n\n"
            "Wir berechnen nach unserem Tarif (Anfahrt, Kilometer und Wartezeit) — gern nennen wir Ihnen vorab einen "
            "Festpreis. Sie erhalten eine ordnungsgemäße Rechnung, die Sie bei Bedarf Ihrer Krankenkasse vorlegen können.\n\n"
            "*Wir sind ein Mietwagen-Fahrdienst nach § 49 PBefG, kein Krankentransport — für liegende Patienten "
            "oder medizinische Betreuung während der Fahrt wenden Sie sich bitte an einen Krankentransportdienst.*"
        ),
        "long_description_en": (
            "## Doctor & Clinic Rides — dignity and safety\n\n"
            "Doctor's appointments, hospital stays and rehab are stressful enough. We take the worry of the journey off your "
            "shoulders — punctual, dignified and with the patience a medical appointment requires.\n\n"
            "### What we offer\n\n"
            "- **Door-to-door service** — we help you in and out of the vehicle\n"
            "- **Patience with longer preparations** — no rushed feeling\n"
            "- **Companions welcome** — the price is per vehicle (up to 4 persons)\n"
            "- **Regional hospitals** — Klinikum Esslingen, Stuttgart hospitals and rehab facilities\n\n"
            "### Price and invoice\n\n"
            "We charge at our tariff (call-out, kilometres and waiting time) — we are happy to quote a fixed price in "
            "advance. You receive a proper invoice that you can submit to your health insurer if needed.\n\n"
            "*We are a private-hire driver service under § 49 PBefG, not a patient transport service — for patients "
            "lying down or needing medical care during the ride, please contact an ambulance transport provider.*"
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Arzt- & Klinikfahrten Esslingen & Plochingen — sicher und würdevoll",
        "meta_title_en": "Doctor & Clinic Rides Esslingen & Plochingen — Safe and Dignified",
        "meta_description_de": "Fahrten zu Arztpraxen, Kliniken und Reha in Deizisau, Plochingen, Esslingen und Umgebung. Tür-zu-Tür-Service, geduldige Fahrer. Personenbeförderung nach § 49 PBefG.",
        "meta_description_en": "Rides to doctors, clinics and rehab in Deizisau, Plochingen, Esslingen and the region. Door-to-door service, patient drivers. Licensed under § 49 PBefG.",
    },
    {
        "sort_order": 40,
        "active": True,
        "icon": "courier",
        "vat_rate": Decimal("0.1900"),
        "slug_de": "kurier-sondertransport",
        "slug_en": "courier-transport",
        "title_de": "Express-Kurier & Terminfracht",
        "title_en": "Express Courier & Scheduled Freight",
        "short_description_de": "Express, Terminfracht und Firmendienst — mit PKW/Kombi oder Sprinter, direkt und termintreu.",
        "short_description_en": "Express, scheduled freight and business service — by car/estate or Sprinter, direct and on time.",
        "long_description_de": (
            "## Express-Kurier & Terminfracht — schnell, sicher, termintreu\n\n"
            "Wenn Dokumente, Pakete oder Ware zuverlässig und pünktlich ankommen müssen, übernehmen wir den direkten "
            "Transport — ohne Umwege, ohne Sammeltour.\n\n"
            "### Was uns auszeichnet\n\n"
            "- **Zwei Fahrzeugklassen** — PKW/Kombi oder Sprinter (Koffer)\n"
            "- **Grundpreis inkl. 5 km und 1 Std. Be-/Entladezeit** — danach nach Kilometern\n"
            "- **Express- und Sonderfahrten** — kurzfristig, gegen Zuschlag\n"
            "- **Termintreue** — feste Abhol- und Lieferzeiten\n"
            "- **Persönliche Übergabe** — direkter Kontakt, kein anonymes Depot\n\n"
            "### Wofür wir fahren\n\n"
            "Express-Sendungen, Terminfracht, regelmäßiger Firmendienst, Ersatzteile, Dokumente und Verträge. "
            "Kurierpreise verstehen sich netto zzgl. der gesetzlichen MwSt.; Strecken über 150 km nach Absprache."
        ),
        "long_description_en": (
            "## Express Courier & Scheduled Freight — fast, secure, on schedule\n\n"
            "When documents, parcels or goods have to arrive reliably and on time, we handle the direct transport — "
            "no detours, no shared route.\n\n"
            "### What sets us apart\n\n"
            "- **Two vehicle classes** — car/estate or Sprinter (box van)\n"
            "- **Base price incl. 5 km and 1 hour of loading/unloading** — then per kilometre\n"
            "- **Express and special trips** — at short notice, for a surcharge\n"
            "- **On schedule** — agreed pickup and delivery times\n"
            "- **Personal handover** — direct contact, no anonymous depot\n\n"
            "### What we carry\n\n"
            "Express shipments, scheduled freight, regular business runs, spare parts, documents and contracts. "
            "Courier prices are net, plus statutory VAT; distances over 150 km by arrangement."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Express-Kurier & Terminfracht Esslingen & Plochingen",
        "meta_title_en": "Express Courier & Scheduled Freight Esslingen & Plochingen",
        "meta_description_de": "Express-Kurier, Terminfracht und Firmendienst mit PKW/Kombi oder Sprinter ab Deizisau. Grundpreis inkl. 5 km und 1 Std. Be-/Entladezeit. Preise netto zzgl. MwSt.",
        "meta_description_en": "Express courier, scheduled freight and business service by car/estate or Sprinter from Deizisau. Base price incl. 5 km and 1 hour loading. Net prices plus VAT.",
    },
]

# No longer offered (not on the campaign flyer). Set inactive rather than deleted so existing
# booking requests keep a valid service reference.
RETIRED_SLUGS = ["schuelerbefoerderung"]


def run() -> None:
    log_section(f"Services ({len(SERVICES)} services)")
    db = SessionLocal()
    try:
        from app.Services.ContentService import ContentService
        from app.Models.services import Service

        actor = get_system_actor(db)
        human_ids = human_edited_ids(db, "services")
        counts = {"created": 0, "updated": 0, "unchanged": 0, "kept": 0, "retired": 0}

        def find(key: str):
            return (
                db.query(Service).filter(Service.seed_key == key).order_by(Service.is_deleted).first()
                or db.query(Service).filter(Service.seed_key.is_(None), Service.slug_de == key).order_by(Service.is_deleted).first()
            )

        for values in SERVICES:
            key = values["slug_de"]
            stamp = {"seed_key": key, "seed_hash": seed_fingerprint(values)}
            existing = find(key)
            if existing is None:
                svc = ContentService.create_service(db, {**values, **stamp}, actor, request=None)
                log_create(f"service '{svc.slug_de}' / '{svc.slug_en}'", f"id={svc.id}")
                counts["created"] += 1
                continue
            action = reconcile(existing, values, human_ids, actor)
            if action == "kept":
                log_kept(f"service '{key}'")
                counts["kept"] += 1
            elif action == "same":
                existing.seed_key, existing.seed_hash = stamp["seed_key"], stamp["seed_hash"]
                db.commit()
                counts["unchanged"] += 1
            else:
                if existing.is_deleted:
                    ContentService.restore_service(db, existing.id, actor, request=None)
                ContentService.update_service(db, existing.id, {**values, **stamp}, actor, request=None)
                counts["updated"] += 1
        fields = tuple(SERVICES[0])
        for slug in RETIRED_SLUGS:
            old = find(slug)
            if old is None or old.is_deleted or not old.active:
                continue
            if not is_unedited(old, fields, human_ids):
                log_kept(f"service '{slug}' (retired in seed, re-activated in admin)")
                continue
            retired = {**{f: getattr(old, f) for f in fields}, "active": False}
            ContentService.update_service(db, old.id, {"active": False, "seed_key": slug, "seed_hash": seed_fingerprint(retired)}, actor, request=None)
            log_create(f"service '{slug}' (retired: set inactive)", f"id={old.id}")
            counts["retired"] += 1
        print("  [done] " + ", ".join(f"{n} {label}" for label, n in counts.items()))
    finally:
        db.close()


if __name__ == "__main__":
    run()
