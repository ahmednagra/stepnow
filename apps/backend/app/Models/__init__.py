# apps/backend/app/Models/__init__.py
from app.Models.base import Base
from app.Models.admin import AdminUser, RefreshToken
from app.Models.audit import AuditLog
from app.Models.settings import SiteSettings
from app.Models.ui_strings import UiString
from app.Models.services import Service
from app.Models.pricing import PricingCategory, PricingItem
from app.Models.vehicles import Vehicle
from app.Models.faqs import Faq
from app.Models.testimonials import Testimonial
from app.Models.legal_pages import LegalPage, LegalPageVersion
from app.Models.bookings import BookingRequest
from app.Models.contact import ContactMessage
from app.Models.email_logs import EmailLog

__all__ = [
    "Base",
    "AdminUser",
    "RefreshToken",
    "AuditLog",
    "SiteSettings",
    "UiString",
    "Service",
    "PricingCategory",
    "PricingItem",
    "Vehicle",
    "Faq",
    "Testimonial",
    "LegalPage",
    "LegalPageVersion",
    "BookingRequest",
    "ContactMessage",
    "EmailLog",
]
