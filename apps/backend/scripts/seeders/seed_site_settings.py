# apps/backend/scripts/seeders/seed_site_settings.py
# Idempotent seeder that creates the singleton site_settings row with Naeem's business data + map coords.
# NOTE: concession_number "GE-2026-001" must be confirmed against the actual Genehmigungsurkunde.
from datetime import date
from decimal import Decimal
import shutil
from pathlib import Path
from config.database import SessionLocal
from config.settings import settings as app_settings  # noqa: E402
from scripts.seeders._base import SYSTEM_ACTOR_EMAIL, get_system_actor, log_section, log_create, log_skip  # noqa: E402


SETTINGS_DATA = {
    "business_name": "StepNow Rides & Movers",
    "owner_name": "Naeem Ahmad e.K.",
    "legal_form": "Einzelunternehmen",
    "address_street": "Blumenstraße 8",
    "address_postcode": "73779",
    "address_city": "Deizisau",
    "address_country": "Deutschland",
    "address_lat": Decimal("48.715500"),
    "address_lng": Decimal("9.373500"),
    "phone": "+49 155 1066 9395",  # display form (flyer grouping); tel: links strip to digits
    "phone_mobile": "0155 1066 9395",
    "email": "accounts@step-now.de",
    "whatsapp_url": "https://wa.me/4915510669395",
    "vat_rate_standard": Decimal("0.1900"),
    "vat_rate_reduced": Decimal("0.0700"),
    "tax_number": "59002/59899",
    "vat_id": "DE 463491338",
    # Handelsregister (e.K.) + bank — printed on the Transportauftrag/Rechnung legal + payment blocks.
    "commercial_register": "HRA 742905",
    "register_court": "AG Stuttgart",
    "iban": "DE10 1001 7997 7961 0444 47",
    "bic": "HOLVDEB1",
    "bank_account_holder": "Naeem Ahmad",
    "website": "www.step-now.de",
    "concession_number": "GE-2026-001",
    "concession_authority": "Landratsamt Esslingen",
    "concession_date": date(2026, 1, 15),
    "opening_hours_de": "Montag - Sonntag: 24 Stunden buchbar\nTelefon: Mo - Fr 06:00 - 22:00\nSa - So 08:00 - 20:00",
    "opening_hours_en": "Monday - Sunday: 24/7 booking\nPhone: Mon - Fri 6:00 - 22:00\nSat - Sun 8:00 - 20:00",
    "social_facebook": None,
    "social_instagram": None,
    "social_youtube": None,
    "social_tiktok": None,
    "default_meta_title_de": "StepNow Rides & Movers — Die Alternative zum Taxi in Esslingen, Plochingen und Umgebung",
    "default_meta_title_en": "StepNow Rides & Movers — The alternative to the taxi in Esslingen, Plochingen and the region",
    "default_og_image_url": None,
    # Trust numbers (homepage TrustStrip) are facts only the owner can state — never seeded. Each
    # stays empty (and hidden on the site) until entered in admin → Settings.
    "years_active": None,
    "rides_completed": None,
    "fleet_size": None,
    "google_rating": None,
    "google_review_count": None,
}

# Placeholder figures earlier versions of this seeder wrote. A row still holding one of them, in a
# field no admin has ever saved, is reset to empty so an invented rating never stays on the site.
FORMER_MOCK_TRUST_FIGURES = {
    "years_active": 8,
    "rides_completed": 12500,
    "fleet_size": 2,
    "google_rating": Decimal("4.9"),
    "google_review_count": 180,
}


def _serialize(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def ensure_logo() -> str | None:
    """The PDFs resolve logo_url relative to apps/backend, so the brand asset has to live there.
    Copy it out of the frontend's public dir once — a fresh clone or VPS deploy has no uploads/."""
    dest = Path(app_settings.UPLOAD_DIR) / "logo.png"
    url = f"{app_settings.UPLOAD_PUBLIC_URL_PREFIX}/logo.png"
    if dest.exists():
        return url
    src = Path(__file__).resolve().parents[3] / "frontend" / "public" / "logo.png"
    if not src.exists():
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
    return url


def run() -> None:
    log_section("Site settings (singleton)")
    db = SessionLocal()
    try:
        from app.Models.settings import SiteSettings

        SETTINGS_DATA["logo_url"] = ensure_logo()
        existing = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
        if existing:
            from sqlalchemy import func
            from app.Models.audit import AuditLog

            # Clear former placeholder trust figures in fields no admin has ever saved (see above).
            admin_saved = {k for (k,) in db.query(func.jsonb_object_keys(AuditLog.changes)).filter(
                AuditLog.table_name == "site_settings", AuditLog.actor_email.is_distinct_from(SYSTEM_ACTOR_EMAIL),
            ).distinct()}
            mock = [f for f, value in FORMER_MOCK_TRUST_FIGURES.items() if getattr(existing, f) == value and f not in admin_saved]
            for f in mock:
                setattr(existing, f, None)
            # Backfill ONLY fields that are still empty — any value the owner has set in admin is
            # never overwritten.
            filled = [
                f for f in (
                    "tax_number", "vat_id", "commercial_register", "register_court", "iban", "bic",
                    "vat_rate_standard", "vat_rate_reduced",
                    "bank_account_holder", "website", "logo_url",
                )
                if getattr(existing, f) is None and SETTINGS_DATA[f] is not None
            ]
            for f in filled:
                setattr(existing, f, SETTINGS_DATA[f])
            if filled or mock:
                db.commit()
                log_create("site_settings", f"backfilled: {', '.join(filled) or '-'}; cleared placeholder trust figures: {', '.join(mock) or '-'}")
            else:
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
