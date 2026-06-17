# apps/backend/app/Services/SettingsService.py
from typing import Any
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError, RequiredFieldError
from app.Core.ProtectedFields import LEGALLY_REQUIRED_FIELDS
from app.Models.admin import AdminUser
from app.Models.settings import SiteSettings
from app.Services.AuditService import AuditService

_SETTINGS_FIELDS = (
    "business_name", "owner_name", "legal_form",
    "address_street", "address_postcode", "address_city", "address_country",
    "phone", "phone_mobile", "email", "whatsapp_url",
    "tax_number", "vat_id",
    "concession_number", "concession_authority", "concession_date",
    "opening_hours_de", "opening_hours_en",
    "social_facebook", "social_instagram", "social_youtube", "social_tiktok",
    "default_meta_title_de", "default_meta_title_en", "default_og_image_url",
    "years_active", "rides_completed", "fleet_size", "google_rating", "google_review_count",
)


class SettingsService:

    @staticmethod
    def get_or_none(db: Session) -> SiteSettings | None:
        return db.query(SiteSettings).filter(SiteSettings.id == 1).first()

    @staticmethod
    def get_required(db: Session) -> SiteSettings:
        s = SettingsService.get_or_none(db)
        if not s:
            raise NotFoundError("Site settings have not been initialized yet")
        return s

    @staticmethod
    def update(db: Session, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> SiteSettings:
        s = SettingsService.get_required(db)
        SettingsService._enforce_required_fields(data)
        before = SettingsService._snapshot(s)
        for k, v in data.items():
            setattr(s, k, v)
        db.flush()
        after = SettingsService._snapshot(s)
        AuditService.log(db, actor, "site_settings", str(s.id), "update", before, after, request)
        db.commit()
        db.refresh(s)
        return s

    @staticmethod
    def _enforce_required_fields(data: dict[str, Any]) -> None:
        # Architecture §15.3: legally-required fields cannot be cleared.
        required = LEGALLY_REQUIRED_FIELDS.get("site_settings", {})
        for field, reason in required.items():
            if field in data and (data[field] is None or (isinstance(data[field], str) and not data[field].strip())):
                raise RequiredFieldError(reason, field=field)

    @staticmethod
    def _snapshot(s: SiteSettings) -> dict[str, Any]:
        return {f: SettingsService._serialize(getattr(s, f)) for f in _SETTINGS_FIELDS}

    @staticmethod
    def _serialize(value: Any) -> Any:
        # Date objects need str conversion for JSONB
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return value

    @staticmethod
    def get_placeholder_values(db: Session) -> dict[str, str]:
        # Used by legal page renderer to resolve {site_settings.field} placeholders.
        s = SettingsService.get_or_none(db)
        if not s:
            return {}
        return {
            "site_settings.business_name": s.business_name or "",
            "site_settings.owner_name": s.owner_name or "",
            "site_settings.legal_form": s.legal_form or "",
            "site_settings.address_street": s.address_street or "",
            "site_settings.address_postcode": s.address_postcode or "",
            "site_settings.address_city": s.address_city or "",
            "site_settings.address_country": s.address_country or "",
            "site_settings.phone": s.phone or "",
            "site_settings.phone_mobile": s.phone_mobile or "",
            "site_settings.email": s.email or "",
            "site_settings.tax_number": s.tax_number or "",
            "site_settings.vat_id": s.vat_id or "",
            "site_settings.concession_number": s.concession_number or "",
            "site_settings.concession_authority": s.concession_authority or "",
            "site_settings.concession_date": s.concession_date.isoformat() if s.concession_date else "",
        }
