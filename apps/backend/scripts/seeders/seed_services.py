# scripts/seeders/seed_services.py
"""Seed the five StepNow services with realistic bilingual content.

Each service has:
- Bilingual slugs (DE/EN)
- Bilingual titles, descriptions
- Markdown long_description (real German prose, not Lorem Ipsum)
- SEO meta fields

Idempotent: keyed by slug_de. Existing services are skipped.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


SERVICES = [
    {
        "sort_order": 10,
        "active": True,
        "icon": "plane",
        "slug_de": "flughafentransfer",
        "slug_en": "airport-transfer",
        "title_de": "Flughafentransfer",
        "title_en": "Airport Transfer",
        "short_description_de": "Pünktlich zum Flieger, entspannt nach Hause. Pauschalpreis mit Flugverfolgung und Wartezeit inklusive.",
        "short_description_en": "Punctual to the airport, relaxed back home. Price including flight tracking and waiting time.",
        "long_description_de": (
            "## Flughafentransfer — komfortabel und zuverlässig\n\n"
            "Ob geschäftlich nach Frankfurt oder privat nach Mallorca: Unser Flughafentransfer bringt Sie sicher und pünktlich "
            "zu allen relevanten Flughäfen der Region — **Stuttgart (STR)**, **Frankfurt (FRA)**, **München (MUC)**, "
            "**Memmingen (FMM)** und **Baden-Airpark (FKB)**.\n\n"
            "### Was uns auszeichnet\n\n"
            "- **Flugverfolgung in Echtzeit** — bei Verspätungen warten wir kostenfrei\n"
            "- **Meet & Greet im Terminal** — auf Wunsch holen wir Sie direkt am Gate ab\n"
            "- **Gepäckhilfe** — selbstverständlich auch bei mehreren Koffern\n"
            "- **Pauschalpreis-Garantie** — der Preis steht vor Fahrtbeginn fest\n"
            "- **60 Minuten Wartezeit kostenfrei** — bei Flügen aus dem Ausland\n\n"
            "### Für wen ist dieser Service?\n\n"
            "Privatreisende, die entspannt anreisen wollen. Geschäftsreisende, die Pünktlichkeit brauchen. Familien mit Kindersitzbedarf. "
            "Senioren, die Unterstützung beim Gepäck schätzen. Alle, denen ein Taxi-Ruf am Terminal zu unsicher ist."
        ),
        "long_description_en": (
            "## Airport Transfer — comfortable and reliable\n\n"
            "Whether business to Frankfurt or holiday to Mallorca: our airport transfer takes you safely and punctually to all "
            "relevant airports in the region — **Stuttgart (STR)**, **Frankfurt (FRA)**, **Munich (MUC)**, "
            "**Memmingen (FMM)** and **Baden-Airpark (FKB)**.\n\n"
            "### What sets us apart\n\n"
            "- **Real-time flight tracking** — if your flight is delayed, we wait at no extra cost\n"
            "- **Meet & Greet at the terminal** — on request we pick you up directly at the gate\n"
            "- **Luggage assistance** — naturally also for multiple suitcases\n"
            "- **Price guarantee** — the price is set before departure\n"
            "- **60 minutes free waiting time** — for international flights\n\n"
            "### Who is this service for?\n\n"
            "Private travellers who want to arrive relaxed. Business travellers who need punctuality. Families needing child seats. "
            "Senior travellers who appreciate help with luggage. Anyone who finds calling a taxi at the terminal too uncertain."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Flughafentransfer Stuttgart — Pauschalpreis, vorgebucht — StepNow Rides",
        "meta_title_en": "Airport Transfer Stuttgart — Price, Pre-booked — StepNow Rides",
        "meta_description_de": "Zuverlässiger Flughafentransfer zum/vom Flughafen Stuttgart und allen Flughäfen der Region. Pauschalpreis-Garantie, Meet & Greet, Flugverfolgung. Konzessioniert nach PBefG.",
        "meta_description_en": "Reliable airport transfer to/from Stuttgart Airport and all airports in the region. Price guarantee, meet & greet, flight tracking. Licensed under PBefG.",
    },
    {
        "sort_order": 20,
        "active": True,
        "icon": "heart-pulse",
        "slug_de": "krankenhausfahrten",
        "slug_en": "hospital-transport",
        "title_de": "Krankenhausfahrten",
        "title_en": "Hospital Transport",
        "short_description_de": "Würdevoller, sicherer Transport zu und von Krankenhäusern, Reha-Einrichtungen und Arztterminen.",
        "short_description_en": "Dignified, safe transport to and from hospitals, rehab facilities and medical appointments.",
        "long_description_de": (
            "## Krankenhausfahrten — Würde und Sicherheit\n\n"
            "Krankenhausbesuche und Reha-Termine sind belastend genug. Wir nehmen Ihnen die Sorge um die Anreise ab — "
            "pünktlich, würdevoll, mit der Geduld, die ein medizinischer Termin verlangt.\n\n"
            "### Was wir bieten\n\n"
            "- **Tür-zu-Tür-Service** — wir helfen beim Ein- und Aussteigen\n"
            "- **Geduld bei längeren Vorbereitungen** — kein gehetztes Gefühl\n"
            "- **Begleitung möglich** — Angehörige fahren selbstverständlich kostenfrei mit\n"
            "- **Bekannt mit den Häusern der Region** — Klinikum Esslingen, Klinikum Stuttgart, Marienhospital, "
            "Robert-Bosch-Krankenhaus, BG-Unfallklinik und weitere\n"
            "- **Auch für Reha-Klinik-Transporte** — Schwarzwald, Bodensee, Bayerische Alpen\n\n"
            "### Hinweis zu Erstattung\n\n"
            "Für Fahrten mit medizinischer Notwendigkeit übernehmen viele Krankenkassen die Kosten ganz oder teilweise. "
            "Wir stellen Ihnen eine ordnungsgemäße Rechnung mit allen erforderlichen Angaben aus."
        ),
        "long_description_en": (
            "## Hospital Transport — Dignity and Safety\n\n"
            "Hospital visits and rehab appointments are stressful enough. We take the worry of the journey off your shoulders — "
            "punctual, dignified, with the patience a medical appointment requires.\n\n"
            "### What we offer\n\n"
            "- **Door-to-door service** — we help you in and out of the vehicle\n"
            "- **Patience with longer preparations** — no rushed feeling\n"
            "- **Companions welcome** — family members travel free of charge\n"
            "- **Familiar with regional hospitals** — Klinikum Esslingen, Klinikum Stuttgart, Marienhospital, "
            "Robert-Bosch-Krankenhaus, BG-Unfallklinik and others\n"
            "- **Also for rehab clinic transport** — Black Forest, Lake Constance, Bavarian Alps\n\n"
            "### Note on reimbursement\n\n"
            "For trips with medical necessity, many German health insurers cover the costs partially or in full. "
            "We provide a proper invoice with all required information."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Krankenhausfahrten Stuttgart Esslingen — Sicher und würdevoll — StepNow Rides",
        "meta_title_en": "Hospital Transport Stuttgart Esslingen — Safe and Dignified — StepNow Rides",
        "meta_description_de": "Würdevoller Transport zu Krankenhäusern und Reha-Einrichtungen in Plochingen/Esslingen. Geduldig, pünktlich, Tür-zu-Tür-Service. Konzessioniert nach PBefG.",
        "meta_description_en": "Dignified transport to hospitals and rehab facilities in Plochingen/Esslingen. Patient, punctual, door-to-door service. Licensed under PBefG.",
    },
    {
        "sort_order": 30,
        "active": True,
        "icon": "graduation-cap",
        "slug_de": "schuelerbefoerderung",
        "slug_en": "school-transport",
        "title_de": "Schülerbeförderung",
        "title_en": "School Transport",
        "short_description_de": "Verlässlicher, regelmäßiger Schulweg-Service. Geprüfte Fahrer, vertraute Gesichter, sichere Fahrzeuge.",
        "short_description_en": "Reliable, regular school commute service. Verified drivers, familiar faces, safe vehicles.",
        "long_description_de": (
            "## Schülerbeförderung — Sicherheit, die Eltern beruhigt\n\n"
            "Wenn der Schulbus zu unzuverlässig ist und der eigene Arbeitsweg nicht passt: Wir übernehmen "
            "den täglichen Schulweg Ihres Kindes — mit der Verbindlichkeit, die Eltern brauchen.\n\n"
            "### Unser Schulweg-Versprechen\n\n"
            "- **Derselbe Fahrer, jeden Tag** — Ihr Kind kennt uns, wir kennen Ihr Kind\n"
            "- **Pünktlich zur ersten Stunde** — keine Verspätung, keine Diskussion\n"
            "- **Kindersitze und Sitzerhöhungen** — gesetzeskonform für jede Altersgruppe\n"
            "- **WhatsApp-Update** — wir bestätigen Abholung und Ankunft\n"
            "- **Notfall-Erreichbarkeit** — direkter Kontakt zum Inhaber, nicht zu einer Zentrale\n\n"
            "### Für wen wir fahren\n\n"
            "Grundschüler, deren Schulweg zu weit für den Bus ist. Gymnasiasten, die in Stuttgart zur Schule gehen, "
            "aber im Umland wohnen. Kinder mit besonderen Förderbedürfnissen. Kinder berufstätiger Eltern, "
            "deren Arbeitszeit nicht zum Schulbeginn passt."
        ),
        "long_description_en": (
            "## School Transport — Safety that puts parents at ease\n\n"
            "When the school bus is too unreliable and your own commute doesn't match: we take over your child's "
            "daily school commute — with the commitment parents need.\n\n"
            "### Our school transport promise\n\n"
            "- **The same driver, every day** — your child knows us, we know your child\n"
            "- **Punctual for the first lesson** — no lateness, no discussion\n"
            "- **Child seats and booster seats** — legally compliant for every age group\n"
            "- **WhatsApp update** — we confirm pickup and arrival\n"
            "- **Direct emergency contact** — straight to the owner, not a call centre\n\n"
            "### Who we drive\n\n"
            "Primary school children whose route is too long for the bus. Secondary students attending school in Stuttgart "
            "but living in the surrounding area. Children with special educational needs. Children of working parents "
            "whose work hours don't match school start times."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Schülerbeförderung Stuttgart — Verlässlich, sicher, persönlich — StepNow Rides",
        "meta_title_en": "School Transport Stuttgart — Reliable, Safe, Personal — StepNow Rides",
        "meta_description_de": "Regelmäßige, verlässliche Schülerbeförderung in Plochingen/Esslingen. Derselbe Fahrer, Kindersitze, WhatsApp-Updates. Konzessioniert nach PBefG.",
        "meta_description_en": "Regular, reliable school transport in Plochingen/Esslingen. Same driver, child seats, WhatsApp updates. Licensed under PBefG.",
    },
    {
        "sort_order": 40,
        "active": True,
        "icon": "users",
        "slug_de": "shuttle-service",
        "slug_en": "shuttle-service",
        "title_de": "Shuttle Service",
        "title_en": "Shuttle Service",
        "short_description_de": "Gruppentransport für Veranstaltungen, Konferenzen, Hochzeiten und Firmenanlässe.",
        "short_description_en": "Group transport for events, conferences, weddings and corporate occasions.",
        "long_description_de": (
            "## Shuttle Service — Gruppentransport ohne Stress\n\n"
            "Hochzeit, Firmenfeier, Konferenz, Tagung: Wenn mehrere Gäste zur gleichen Zeit zum gleichen Ort müssen, "
            "übernehmen wir die Koordination. Sie konzentrieren sich auf Ihre Veranstaltung — wir auf die Logistik.\n\n"
            "### Was wir koordinieren\n\n"
            "- **Mehrere Abholpunkte, ein Ziel** — Gäste werden eingesammelt und gemeinsam gebracht\n"
            "- **Hin- und Rückfahrt** — auch zu späten Stunden, auch am Wochenende\n"
            "- **Bis zu 8 Personen pro Fahrzeug** — geräumiger Van mit voller Ausstattung\n"
            "- **Mehrere Fahrzeuge möglich** — größere Gruppen kein Problem\n"
            "- **Pauschalpreis pro Gruppe** — der Preis steht vorab fest\n\n"
            "### Typische Anlässe\n\n"
            "Hochzeiten (Brautpaar und Gäste, Wechsel zwischen Standesamt, Kirche, Restaurant). "
            "Firmenfeiern (Sammeltransport vom Büro zum Veranstaltungsort und zurück). "
            "Konferenzen (Shuttle zwischen Hotel und Tagungszentrum). "
            "Geburtstagsfeiern, Jubiläen, runde Geburtstage."
        ),
        "long_description_en": (
            "## Shuttle Service — Group transport without stress\n\n"
            "Wedding, company party, conference, meeting: when several guests need to be at the same place at the same time, "
            "we handle the coordination. You focus on your event — we focus on the logistics.\n\n"
            "### What we coordinate\n\n"
            "- **Multiple pickup points, one destination** — guests are collected and brought together\n"
            "- **Outbound and return** — including late evening, including weekends\n"
            "- **Up to 8 passengers per vehicle** — spacious van, fully equipped\n"
            "- **Multiple vehicles possible** — larger groups no problem\n"
            "- **Price per group** — the price is set in advance\n\n"
            "### Typical occasions\n\n"
            "Weddings (couple and guests, transitions between registry office, church, restaurant). "
            "Company events (collective transport from office to venue and back). "
            "Conferences (shuttle between hotel and conference centre). "
            "Birthday parties, anniversaries, milestone birthdays."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Shuttle Service Stuttgart — Gruppentransport für Events — StepNow Rides",
        "meta_title_en": "Shuttle Service Stuttgart — Group Transport for Events — StepNow Rides",
        "meta_description_de": "Gruppentransport für Hochzeiten, Firmenfeiern, Konferenzen und Tagungen in Plochingen/Esslingen. Pauschalpreis, mehrere Abholpunkte, bis 8 Personen pro Fahrzeug.",
        "meta_description_en": "Group transport for weddings, company events, conferences and meetings in Plochingen/Esslingen. Price, multiple pickups, up to 8 passengers per vehicle.",
    },
    {
        "sort_order": 50,
        "active": True,
        "icon": "courier",
        "slug_de": "kurier-sondertransport",
        "slug_en": "courier-transport",
        "title_de": "Kurier-/Sondertransport",
        "title_en": "Courier / Special Transport",
        "short_description_de": "Schnelle Kurier- und Sonderfahrten für Dokumente, Pakete und zeitkritische Sendungen.",
        "short_description_en": "Fast courier and special transport for documents, parcels and time-critical shipments.",
        "long_description_de": (
            "## Kurier-/Sondertransport — schnell, sicher, termintreu\n\n"
            "Wenn ein Dokument, ein Paket oder eine zeitkritische Sendung zuverlässig ankommen muss, übernehmen wir "
            "den direkten Transport — ohne Umwege, ohne Sammeltour.\n\n"
            "### Was uns auszeichnet\n\n"
            "- **Direktfahrt** — Ihre Sendung fährt allein, ohne Zwischenstopps\n"
            "- **Pauschalpreis** — der Preis steht vor Abfahrt fest\n"
            "- **Termintreue** — feste Abhol- und Lieferzeiten\n"
            "- **Persönliche Übergabe** — direkter Kontakt, kein anonymes Depot\n\n"
            "### Wofür wir fahren\n\n"
            "Dokumente und Verträge, Ersatzteile, Apotheken- und Laborproben, vergessene Gepäckstücke und andere "
            "Sonderfahrten auf Anfrage."
        ),
        "long_description_en": (
            "## Courier / Special Transport — fast, secure, on schedule\n\n"
            "When a document, parcel or time-critical shipment has to arrive reliably, we handle the direct transport — "
            "no detours, no shared route.\n\n"
            "### What sets us apart\n\n"
            "- **Direct trip** — your shipment travels on its own, no intermediate stops\n"
            "- **Price** — the price is set before departure\n"
            "- **On schedule** — agreed pickup and delivery times\n"
            "- **Personal handover** — direct contact, no anonymous depot\n\n"
            "### What we carry\n\n"
            "Documents and contracts, spare parts, pharmacy and lab samples, forgotten luggage and other special "
            "trips on request."
        ),
        "hero_image_url": None,
        "og_image_url": None,
        "meta_title_de": "Kurier-/Sondertransport Plochingen/Esslingen — StepNow Rides",
        "meta_title_en": "Courier / Special Transport Plochingen/Esslingen — StepNow Rides",
        "meta_description_de": "Schnelle Kurier- und Sonderfahrten in Plochingen/Esslingen. Konzessioniert nach PBefG.",
        "meta_description_en": "Fast courier and special transport in Plochingen/Esslingen. Licensed under PBefG.",
    },
]


def run() -> None:
    log_section(f"Services ({len(SERVICES)} services)")
    db = SessionLocal()
    try:
        from app.Services.ContentService import ContentService
        from app.Models.services import Service

        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for svc_data in SERVICES:
            existing = (
                db.query(Service).filter(Service.slug_de == svc_data["slug_de"]).first()
            )
            if existing:
                log_skip(f"service '{svc_data['slug_de']}'", f"id={existing.id}")
                skipped += 1
                continue
            svc = ContentService.create_service(db, svc_data, actor, request=None)
            log_create(f"service '{svc.slug_de}' / '{svc.slug_en}'", f"id={svc.id}")
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
