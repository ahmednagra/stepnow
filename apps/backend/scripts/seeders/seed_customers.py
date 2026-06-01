# apps/backend/scripts/seeders/seed_customers.py

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402

CUSTOMERS = [
    {
        "first_name": "Sabine",
        "last_name": "Keller",
        "is_business": False,
        "company_name": None,
        "company_vatid": None,
        "street": "Marktstraße 12",
        "plz": "73207",
        "ort": "Plochingen",
        "email": "sabine.keller@example.de",
        "phone": "+49 7153 123456",
        "internal_notes": "Seed: regular private courier customer.",
    },
    {
        "first_name": "Thomas",
        "last_name": "Bauer",
        "is_business": True,
        "company_name": "Bauer Elektrotechnik GmbH",
        "company_vatid": "DE298765432",
        "street": "Industriestraße 5",
        "plz": "73730",
        "ort": "Esslingen",
        "email": "dispatch@bauer-elektro.de",
        "phone": "+49 711 9876540",
        "internal_notes": "Seed: B2B account, parts runs.",
    },
    {
        "first_name": "Aylin",
        "last_name": "Demir",
        "is_business": False,
        "company_name": None,
        "company_vatid": None,
        "street": "Bahnhofstraße 28",
        "plz": "73779",
        "ort": "Deizisau",
        "email": "aylin.demir@example.de",
        "phone": "+49 159 01234567",
        "internal_notes": "Seed: private.",
    },
]


def run() -> None:
    log_section(f"Customers ({len(CUSTOMERS)} customers)")
    db = SessionLocal()
    try:
        from app.Models.customers import Customer
        from app.Services.CustomersService import CustomersService

        actor = get_system_actor(db)
        created = skipped = 0
        for data in CUSTOMERS:
            existing = (
                db.query(Customer).filter(Customer.email == data["email"]).first()
            )
            if existing:
                log_skip(f"customer '{data['email']}'", f"id={existing.id}")
                skipped += 1
                continue
            c = CustomersService.create(db, dict(data), actor, request=None)
            log_create(f"customer '{c.first_name} {c.last_name}'", f"id={c.id}")
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
