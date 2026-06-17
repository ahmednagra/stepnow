# scripts/seeders/seed_site_settings.py
# Idempotent seeder that creates the singleton site_settings row with Naeem's business data + map coords.
from datetime import date
from decimal import Decimal
from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


SETTINGS_DATA = {
    "business_name": "StepNow Rides & Movers",
    "owner_name": "Naeem Ahmad",
    "legal_form": "Einzelunternehmen",
    "address_street": "Blumenstraße 8",
    "address_postcode": "73779",
    "address_city": "Deizisau",
    "address_country": "Deutschland",
    "address_lat": Decimal("48.715500"),
    "address_lng": Decimal("9.373500"),
    "phone": "+49 7153 9292841",
    "phone_mobile": "+49 159 01225850",
    "email": "info@step-now.de",
    "whatsapp_url": "https://wa.me/4915901225850",
    "tax_number": None,
    "vat_id": None,
    "concession_number": "GE-2026-001",
    "concession_authority": "Landratsamt Esslingen",
    "concession_date": date(2026, 1, 15),
    "opening_hours_de": "Montag - Sonntag: 24 Stunden buchbar\nTelefon: Mo - Fr 06:00 - 22:00\nSa - So 08:00 - 20:00",
    "opening_hours_en": "Monday - Sunday: 24/7 booking\nPhone: Mon - Fri 6:00 - 22:00\nSat - Sun 8:00 - 20:00",
    "social_facebook": None,
    "social_instagram": None,
    "social_youtube": None,
    "social_tiktok": None,
    "default_meta_title_de": "StepNow Rides — Ihre TAXI-Alternative in Stuttgart, Esslingen und Region",
    "default_meta_title_en": "StepNow Rides — Your premium taxi alternative in Stuttgart, Germany",
    "default_og_image_url": None,
    # Trust numbers — owner edits in admin; seed only the verifiable fleet size, leave the rest null.
    "years_active": None,
    "rides_completed": None,
    "fleet_size": 2,
    "google_rating": None,
    "google_review_count": None,
}


def _serialize(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def run() -> None:
    log_section("Site settings (singleton)")
    db = SessionLocal()
    try:
        from app.Models.settings import SiteSettings

        existing = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
        if existing:
            log_skip("site_settings", f"id=1, business_name='{existing.business_name}'")
            return
        actor = get_system_actor(db)
        settings = SiteSettings(id=1, **SETTINGS_DATA)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        from app.Services.AuditService import AuditService

        snapshot = {k: _serialize(v) for k, v in SETTINGS_DATA.items()}
        AuditService.log(
            db, actor, "site_settings", str(settings.id), "create", None, snapshot, None
        )
        db.commit()
        log_create(
            "site_settings",
            f"business='{settings.business_name}', concession={settings.concession_number}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
