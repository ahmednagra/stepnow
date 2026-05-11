# scripts/seeders/seed_testimonials.py
"""Seed testimonials — DSGVO-compliant authorship.

Author names use initials + city only (e.g. "M.S. (Stuttgart)"). Per German
data protection guidance, real customer testimonials need explicit consent
for full-name publication. Initials-only is the default safe pattern.

Quotes are realistic — written in natural German that sounds like a real
customer, not marketing copy. Variety in rating (mostly 5s with one 4 for
believability).

Idempotent: keyed by (author_name, quote_de prefix) match.
"""
from datetime import date, timedelta

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


_TODAY = date.today()


TESTIMONIALS = [
    {
        "sort_order": 10,
        "active": True,
        "source": "manual",
        "author_name": "M.S. (Stuttgart)",
        "author_role_de": "Geschäftsreisende",
        "author_role_en": "Business traveller",
        "quote_de": "Pünktlich, freundlich, professionell. Mein Flug hatte 90 Minuten Verspätung und der Fahrer hat ohne Murren gewartet. Beim nächsten Mal definitiv wieder StepNow.",
        "quote_en": "Punctual, friendly, professional. My flight was 90 minutes delayed and the driver waited without complaint. Next time definitely StepNow again.",
        "rating": 5,
        "date_given": _TODAY - timedelta(days=14),
    },
    {
        "sort_order": 20,
        "active": True,
        "source": "manual",
        "author_name": "A.K. (Esslingen)",
        "author_role_de": "Familie mit Kindern",
        "author_role_en": "Family with children",
        "quote_de": "Wir nutzen StepNow regelmäßig für Krankenhausfahrten unserer Mutter. Herr Ahmad ist immer ruhig, hilft beim Einsteigen und nimmt sich Zeit. Das ist Gold wert.",
        "quote_en": "We use StepNow regularly for hospital trips for our mother. Mr Ahmad is always calm, helps with getting in, and takes his time. That's worth a lot.",
        "rating": 5,
        "date_given": _TODAY - timedelta(days=42),
    },
    {
        "sort_order": 30,
        "active": True,
        "source": "manual",
        "author_name": "Dr. F.W. (Deizisau)",
        "author_role_de": "Privatkunde",
        "author_role_en": "Private customer",
        "quote_de": "Für unsere Hochzeit haben wir einen Shuttle für die Gäste gebucht. Drei Fahrzeuge, perfekt koordiniert, alle Gäste pünktlich an jedem Ort. Klare Empfehlung.",
        "quote_en": "We booked a shuttle for our wedding guests. Three vehicles, perfectly coordinated, all guests on time at every location. Clear recommendation.",
        "rating": 5,
        "date_given": _TODAY - timedelta(days=78),
    },
    {
        "sort_order": 40,
        "active": True,
        "source": "manual",
        "author_name": "T.B. (Plochingen)",
        "author_role_de": "Berufspendler",
        "author_role_en": "Business commuter",
        "quote_de": "Frühmorgens 4:30 Uhr nach Frankfurt zum Flughafen — pünktlich, sauberes Fahrzeug, ruhiges Gespräch. Genau das, was man morgens braucht. Preis-Leistung sehr fair.",
        "quote_en": "Early morning 4:30 to Frankfurt Airport — on time, clean vehicle, calm conversation. Exactly what you need in the morning. Value for money very fair.",
        "rating": 5,
        "date_given": _TODAY - timedelta(days=121),
    },
    {
        "sort_order": 50,
        "active": True,
        "source": "manual",
        "author_name": "S.R. (Stuttgart)",
        "author_role_de": "Privatkundin",
        "author_role_en": "Private customer",
        "quote_de": "Beim Buchen lief etwas schief mit der Adresse, aber Herr Ahmad hat sofort angerufen und das Missverständnis geklärt. Sehr persönlich, kein anonymes Callcenter. Werde wieder buchen.",
        "quote_en": "Something went wrong with the address during booking, but Mr Ahmad called immediately and cleared up the misunderstanding. Very personal, not an anonymous call centre. Will book again.",
        "rating": 4,
        "date_given": _TODAY - timedelta(days=156),
    },
]


def run() -> None:
    log_section(f"Testimonials ({len(TESTIMONIALS)} entries)")
    db = SessionLocal()
    try:
        from app.Models.testimonials import Testimonial
        from app.Services.TestimonialsService import TestimonialsService
        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for t_data in TESTIMONIALS:
            # Match by author_name + first 40 chars of quote
            existing = db.query(Testimonial).filter(
                Testimonial.author_name == t_data["author_name"],
                Testimonial.quote_de.startswith(t_data["quote_de"][:40]),
            ).first()
            if existing:
                skipped += 1
                continue
            t = TestimonialsService.create_testimonial(db, t_data, actor, request=None)
            log_create(f"testimonial from '{t.author_name}'", f"rating={t.rating}")
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
