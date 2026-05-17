# scripts/seeders/seed_bookings.py
"""Seed sample bookings — one in each of the 6 lifecycle states.

Customer names are clearly fake (Max Mustermann, Anna Beispiel — the German
equivalents of John Doe) so seed data can't be confused with real
submissions. Email domains use @example.com / @example.de.

Lifecycle distribution:
- new        (just submitted, awaiting Naeem)
- contacted  (Naeem reached out, gathering info)
- quoted     (price quoted, awaiting customer confirm)
- confirmed  (customer confirmed, ride scheduled)
- completed  (ride completed)
- cancelled  (cancelled at any stage)

For 'quoted'+, we mark quoted_at; for 'completed', completed_at. The
FormsService.submit_booking() creates with status='new', so we update
afterwards using FormsAdminService for the lifecycle transitions.

Idempotent: seeded bookings have references starting with 'SN-SEED' to
distinguish from real bookings. Re-running checks for these.
"""
from datetime import datetime, timedelta, timezone

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


_NOW = datetime.now(timezone.utc)


SAMPLE_BOOKINGS = [
    {
        "_target_status": "new",
        "service_slug": "flughafentransfer",
        "pickup_address": "Deizisau, Blumenstraße",
        "pickup_postcode": "73779",
        "pickup_city": "Deizisau",
        "destination_address": "Flughafen Stuttgart, Terminal 1",
        "destination_postcode": "70629",
        "destination_city": "Stuttgart",
        "requested_datetime": _NOW + timedelta(days=3, hours=6),
        "passenger_count": 2,
        "luggage_count": 3,
        "special_requirements": None,
        "customer_name": "Max Mustermann",
        "customer_phone": "+49 171 1234567",
        "customer_email": "max.mustermann@example.com",
        "is_business": False,
        "language": "de",
    },
    {
        "_target_status": "contacted",
        "_internal_notes": "Kunde angerufen, klärt noch Abholzeit ab. Rückruf morgen 10:00 Uhr.",
        "service_slug": "krankenhausfahrten",
        "pickup_address": "Esslingen, Hindenburgstraße 15",
        "pickup_postcode": "73728",
        "pickup_city": "Esslingen",
        "destination_address": "Klinikum Esslingen, Hirschlandstraße 97",
        "destination_postcode": "73730",
        "destination_city": "Esslingen",
        "requested_datetime": _NOW + timedelta(days=5, hours=9),
        "passenger_count": 1,
        "luggage_count": 0,
        "special_requirements": "Begleitperson, Geh-Hilfe (Rollator)",
        "customer_name": "Anna Beispiel",
        "customer_phone": "+49 170 9876543",
        "customer_email": "anna.beispiel@example.com",
        "is_business": False,
        "language": "de",
    },
    {
        "_target_status": "quoted",
        "_internal_notes": "Festpreis 320 € für Frankfurt Airport bestätigt. Wartet auf Bestätigung des Kunden.",
        "_quoted_price": "320.00",
        "service_slug": "flughafentransfer",
        "pickup_address": "Stuttgart Hauptbahnhof, Arnulf-Klett-Platz 2",
        "pickup_postcode": "70173",
        "pickup_city": "Stuttgart",
        "destination_address": "Flughafen Frankfurt, Terminal 2",
        "destination_postcode": "60549",
        "destination_city": "Frankfurt am Main",
        "requested_datetime": _NOW + timedelta(days=7, hours=4),
        "passenger_count": 3,
        "luggage_count": 4,
        "special_requirements": None,
        "customer_name": "Thomas Probe",
        "customer_phone": "+49 173 5551234",
        "customer_email": "thomas.probe@example.de",
        "is_business": True,
        "company_name": "Beispiel Consulting GmbH",
        "company_vatid": "DE123456789",
        "language": "de",
    },
    {
        "_target_status": "confirmed",
        "_internal_notes": "Kunde hat bestätigt. Hochzeitsgesellschaft, V-Klasse + E-Klasse. Treffpunkt Hotel.",
        "_quoted_price": "580.00",
        "service_slug": "shuttle-service",
        "pickup_address": "Hotel Maritim, Seidenstraße 34",
        "pickup_postcode": "70174",
        "pickup_city": "Stuttgart",
        "destination_address": "Schloss Solitude, Solitude 1",
        "destination_postcode": "70197",
        "destination_city": "Stuttgart",
        "requested_datetime": _NOW + timedelta(days=14, hours=11),
        "passenger_count": 8,
        "luggage_count": 0,
        "special_requirements": "Hochzeitsgesellschaft. Rückfahrt um 23:00 Uhr ebenfalls vereinbart.",
        "customer_name": "Lisa Demo",
        "customer_phone": "+49 175 4567890",
        "customer_email": "lisa.demo@example.de",
        "is_business": False,
        "language": "de",
    },
    {
        "_target_status": "completed",
        "_internal_notes": "Fahrt durchgeführt. Pünktlich, ohne Beanstandungen. Stammkunde — bei nächstem Mal Stammkunden-Rabatt anbieten.",
        "_quoted_price": "45.00",
        "service_slug": "flughafentransfer",
        "pickup_address": "Esslingen, Bahnhofstraße",
        "pickup_postcode": "73728",
        "pickup_city": "Esslingen",
        "destination_address": "Flughafen Stuttgart, Terminal 3",
        "destination_postcode": "70629",
        "destination_city": "Stuttgart",
        "requested_datetime": _NOW - timedelta(days=3, hours=12),
        "passenger_count": 1,
        "luggage_count": 1,
        "special_requirements": None,
        "customer_name": "Peter Sample",
        "customer_phone": "+49 176 1112233",
        "customer_email": "peter.sample@example.com",
        "is_business": False,
        "language": "de",
    },
    {
        "_target_status": "cancelled",
        "_internal_notes": "Kunde hat 36 Stunden vor Termin storniert. Kostenfrei, da > 24 Std. Frist.",
        "service_slug": "krankenhausfahrten",
        "pickup_address": "Plochingen, Esslinger Straße 12",
        "pickup_postcode": "73207",
        "pickup_city": "Plochingen",
        "destination_address": "BG-Unfallklinik Tübingen, Schnarrenbergstraße 95",
        "destination_postcode": "72076",
        "destination_city": "Tübingen",
        "requested_datetime": _NOW + timedelta(days=10, hours=14),
        "passenger_count": 1,
        "luggage_count": 0,
        "special_requirements": None,
        "customer_name": "Karl Test",
        "customer_phone": "+49 177 9988776",
        "customer_email": "karl.test@example.com",
        "is_business": False,
        "language": "de",
    },
]


def run() -> None:
    log_section(f"Sample bookings ({len(SAMPLE_BOOKINGS)} across lifecycle states)")
    db = SessionLocal()
    try:
        from app.Models.bookings import BookingRequest
        from app.Models.services import Service
        from app.Services.FormsService import FormsService
        from app.Services.FormsAdminService import FormsAdminService
        actor = get_system_actor(db)

        # Check if any seeded bookings exist (by customer_email match against our fake addresses)
        existing_seeded = db.query(BookingRequest).filter(
            BookingRequest.customer_email.in_([b["customer_email"] for b in SAMPLE_BOOKINGS])
        ).count()
        if existing_seeded > 0:
            log_skip(f"sample bookings", f"{existing_seeded} already seeded — re-run after manual cleanup if needed")
            return

        created = 0
        for booking_data in SAMPLE_BOOKINGS:
            target_status = booking_data.pop("_target_status")
            internal_notes = booking_data.pop("_internal_notes", None)
            quoted_price = booking_data.pop("_quoted_price", None)
            service_slug = booking_data.pop("service_slug")

            # Look up service_id from slug
            svc = db.query(Service).filter(Service.slug_de == service_slug).first()
            booking_payload = {**booking_data, "service_id": svc.id if svc else None, "consent_dsgvo": True}

            # Submit creates as status='new'
            booking, _ = FormsService.submit_booking(db, booking_payload, request=None)
            if not booking:
                print(f"  [error] submit_booking returned None for {booking_data['customer_name']}")
                continue

            # Transition to target status if not 'new'
            if target_status != "new":
                update_data = {"status": target_status}
                if quoted_price:
                    update_data["quoted_price_eur"] = quoted_price
                if internal_notes:
                    update_data["internal_notes"] = internal_notes
                FormsAdminService.update_booking(db, booking.id, update_data, actor, request=None)

            log_create(f"booking {booking.reference}", f"status={target_status}, customer={booking_data['customer_name']}")
            created += 1
        print(f"  [done] {created} bookings created across lifecycle states")
    finally:
        db.close()


if __name__ == "__main__":
    run()
