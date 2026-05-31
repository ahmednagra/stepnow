# scripts/seeders/seed_contact_messages.py
"""Seed contact messages — mix of categories, mix of handled/unhandled.

Useful for admin demo: shows the list with filters working, mix of states.

Idempotent: keyed by email + first 30 chars of message.
"""

from datetime import datetime, timedelta, timezone

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


_NOW = datetime.now(timezone.utc)


SAMPLE_MESSAGES = [
    {
        "_handled": False,
        "subject_category": "general",
        "name": "Hannah Sample",
        "email": "hannah.sample@example.com",
        "phone": "+49 172 1234567",
        "message": (
            "Guten Tag,\n\n"
            "ich plane eine Fahrt mit meiner Mutter (Rollator, 85 Jahre) "
            "von Esslingen zum Marienhospital Stuttgart. Können Sie das "
            "übernehmen und wie lange dauert die Fahrt etwa?\n\n"
            "Vielen Dank,\nHannah Sample"
        ),
        "language": "de",
    },
    {
        "_handled": False,
        "subject_category": "business",
        "name": "Christian Probe",
        "email": "c.probe@example-firma.de",
        "phone": "+49 711 9876543",
        "message": (
            "Sehr geehrte Damen und Herren,\n\n"
            "wir suchen einen verlässlichen Partner für regelmäßige Flughafentransfers "
            "unserer Mitarbeiter (Stuttgart -> STR/FRA/MUC, etwa 4-6 Fahrten pro Monat). "
            "Können wir einen Rahmenvertrag mit Geschäftskunden-Konditionen besprechen? "
            "Gerne telefonisch oder per E-Mail.\n\n"
            "Mit freundlichen Grüßen,\nChristian Probe\nBeispiel GmbH"
        ),
        "language": "de",
    },
    {
        "_handled": True,
        "_handled_days_ago": 4,
        "_internal_notes": "Rückruf am 7.5. erfolgt. Termin für Hochzeit am 22.6. fest vereinbart. Booking SN-20260622-XXXXXX anlegen.",
        "subject_category": "booking",
        "name": "Marie Demo",
        "email": "marie.demo@example.de",
        "phone": "+49 173 5556677",
        "message": (
            "Hallo, wir heiraten am 22. Juni und brauchen Shuttle für ca. 12 Gäste "
            "von Hotel Maritim zur Trauung im Schloss Solitude und zurück. "
            "Können Sie das? Wie sind die Preise?\n\nLG Marie"
        ),
        "language": "de",
    },
    {
        "_handled": False,
        "subject_category": "general",
        "name": "John Example",
        "email": "john.example@example.co.uk",
        "phone": None,
        "message": (
            "Hello,\n\n"
            "I'll be flying into Stuttgart Airport on the 18th for a business trip. "
            "Could you arrange a transfer to the Mercedes-Benz Museum where I have a meeting, "
            "and then later to my hotel near Stuttgart Hauptbahnhof? "
            "What would the price be?\n\nBest,\nJohn"
        ),
        "language": "en",
    },
]


def run() -> None:
    log_section(f"Sample contact messages ({len(SAMPLE_MESSAGES)} entries)")
    db = SessionLocal()
    try:
        from app.Models.contact import ContactMessage
        from app.Services.FormsService import FormsService
        from app.Services.FormsAdminService import FormsAdminService

        actor = get_system_actor(db)

        existing_seeded = (
            db.query(ContactMessage)
            .filter(ContactMessage.email.in_([m["email"] for m in SAMPLE_MESSAGES]))
            .count()
        )
        if existing_seeded > 0:
            log_skip(
                f"sample contact messages",
                f"{existing_seeded} already seeded — re-run after manual cleanup if needed",
            )
            return

        created = 0
        for msg_data in SAMPLE_MESSAGES:
            handled = msg_data.pop("_handled", False)
            handled_days_ago = msg_data.pop("_handled_days_ago", 0)
            internal_notes = msg_data.pop("_internal_notes", None)

            payload = {**msg_data, "consent_dsgvo": True}
            message, _ = FormsService.submit_contact(db, payload, request=None)
            if not message:
                continue

            if handled:
                update_data = {"is_handled": True}
                if internal_notes:
                    update_data["internal_notes"] = internal_notes
                FormsAdminService.update_contact_message(
                    db, message.id, update_data, actor, request=None
                )

            log_create(
                f"contact msg from '{message.name}'",
                f"category={message.subject_category}, handled={handled}",
            )
            created += 1
        print(f"  [done] {created} contact messages created")
    finally:
        db.close()


if __name__ == "__main__":
    run()
