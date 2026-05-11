# scripts/seeders/seed_site_settings.py
"""Seed the site_settings singleton row.

Uses Naeem's real business data (Blumenstr. 8, Deizisau; +49 7153 9292841;
info@step-now.de) so the seeded legal pages render with correct placeholders.
The business_name is suffixed with '(Dev)' to make seed data visually
distinguishable in admin views.

To use real production values, edit via /admin/settings or run with --force
after updating the constants in this file.

Idempotent: re-running is a no-op if id=1 already exists.
"""
from datetime import date

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


SETTINGS_DATA = {
    "business_name": "StepNow Rides & Movers (Dev)",
    "owner_name": "Naeem Ahmad",
    "legal_form": "Einzelunternehmen",
    "address_street": "Blumenstraße 8",
    "address_postcode": "73779",
    "address_city": "Deizisau",
    "address_country": "Deutschland",
    "phone": "+49 7153 9292841",
    "phone_mobile": "+49 159 01225856",
    "email": "info@step-now.de",
    "whatsapp_url": "https://wa.me/4915901225856",
    "tax_number": None,        # Naeem to provide
    "vat_id": None,            # Naeem to provide
    "concession_number": "GE-2026-001",
    "concession_authority": "Landratsamt Esslingen",
    "concession_date": date(2026, 1, 15),
    "opening_hours_de": (
        "Montag - Sonntag: 24 Stunden buchbar\n"
        "Telefon: Mo - Fr 06:00 - 22:00\n"
        "Sa - So 08:00 - 20:00"
    ),
    "opening_hours_en": (
        "Monday - Sunday: 24/7 booking\n"
        "Phone: Mon - Fri 6:00 - 22:00\n"
        "Sat - Sun 8:00 - 20:00"
    ),
    "social_facebook": None,
    "social_instagram": None,
    "social_youtube": None,
    "social_tiktok": None,
    "default_meta_title_de": "StepNow Rides — Ihre TAXI-Alternative in Stuttgart, Esslingen und Region",
    "default_meta_title_en": "StepNow Rides — Your premium taxi alternative in Stuttgart, Germany",
    "default_og_image_url": None,
}


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
        # Audit log for the create
        from app.Services.AuditService import AuditService
        snapshot = {k: _serialize(v) for k, v in SETTINGS_DATA.items()}
        AuditService.log(db, actor, "site_settings", str(settings.id), "create", None, snapshot, None)
        db.commit()
        log_create("site_settings", f"business='{settings.business_name}', concession={settings.concession_number}")
    finally:
        db.close()


def _serialize(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


if __name__ == "__main__":
    run()
