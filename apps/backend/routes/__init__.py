# apps/backend/routes/__init__.py
# API router registration. Critical: admin_dashboard MUST register before admin_forms_router, otherwise literal /admin/bookings/{heatmap,upcoming} get captured by /admin/bookings/{booking_id} (UUID) → 422.

from fastapi import FastAPI

# Public + auth (registered first so admin routes can rely on /auth/login being reachable)
from routes.api.v0 import auth as auth_router
from routes.api.v0 import public as public_router

# Admin routers — imports sorted alphabetically for scannability; registration order below is what matters at runtime.
from routes.api.v0.admin import audit_log as admin_audit_log_router
from routes.api.v0.admin import dashboard as admin_dashboard_router
from routes.api.v0.admin import faqs as admin_faqs_router
from routes.api.v0.admin import forms_admin as admin_forms_router
from routes.api.v0.admin import legal_pages as admin_legal_pages_router
from routes.api.v0.admin import pricing as admin_pricing_router
from routes.api.v0.admin import services as admin_services_router
from routes.api.v0.admin import settings as admin_settings_router
from routes.api.v0.admin import testimonials as admin_testimonials_router
from routes.api.v0.admin import ui_strings as admin_ui_strings_router
from routes.api.v0.admin import uploads as admin_uploads_router
from routes.api.v0.admin import vehicles as admin_vehicles_router

from routes.api.v0.admin.drivers import router as admin_drivers_router
from routes.api.v0.admin.customers import router as admin_customers_router
from routes.api.v0.admin.courier import router as admin_courier_router

_API_PREFIX = "/api/v0"


def setup_api_routes(app: FastAPI) -> None:
    # Registration order matters where two routers declare paths sharing a prefix without a router-level `prefix=`. FastAPI matches first-registered-wins.
    app.include_router(public_router.router, prefix=_API_PREFIX)
    app.include_router(auth_router.router, prefix=_API_PREFIX)

    # Admin: routers with their own prefix=... can appear in any order (settings, ui_strings, services, pricing, vehicles, faqs, testimonials, legal_pages, uploads, audit_log).
    app.include_router(admin_settings_router.router, prefix=_API_PREFIX)
    app.include_router(admin_ui_strings_router.router, prefix=_API_PREFIX)
    app.include_router(admin_services_router.router, prefix=_API_PREFIX)
    app.include_router(admin_pricing_router.router, prefix=_API_PREFIX)
    app.include_router(admin_vehicles_router.router, prefix=_API_PREFIX)
    app.include_router(admin_faqs_router.router, prefix=_API_PREFIX)
    app.include_router(admin_testimonials_router.router, prefix=_API_PREFIX)
    app.include_router(admin_legal_pages_router.router, prefix=_API_PREFIX)

    # CRITICAL ORDER: dashboard BEFORE forms_admin. Both declare paths under /admin/bookings/ without a router prefix. dashboard owns the literal sub-paths (/heatmap, /upcoming); forms_admin owns the UUID path-param (/{booking_id}). Reverse this and the literals get swallowed by the UUID matcher → 422 on every dashboard call.
    app.include_router(admin_dashboard_router.router, prefix=_API_PREFIX)
    app.include_router(admin_forms_router.router, prefix=_API_PREFIX)

    app.include_router(admin_uploads_router.router, prefix=_API_PREFIX)
    app.include_router(admin_audit_log_router.router, prefix=_API_PREFIX)

    app.include_router(admin_drivers_router, prefix=_API_PREFIX)
    app.include_router(admin_customers_router, prefix=_API_PREFIX)
    app.include_router(admin_courier_router, prefix=_API_PREFIX)
