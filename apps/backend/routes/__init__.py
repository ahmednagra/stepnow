# apps/backend/routes/__init__.py
# API router registration. admin_dashboard MUST be registered before admin_forms_router so that literal /admin/bookings/{heatmap,upcoming} routes win over the /admin/bookings/{booking_id} path-param route.

from fastapi import FastAPI
from routes.api.v0 import auth as auth_router
from routes.api.v0 import public as public_router
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

_API_PREFIX = "/api/v0"


def setup_api_routes(app: FastAPI) -> None:
    app.include_router(public_router.router, prefix=_API_PREFIX)
    app.include_router(auth_router.router, prefix=_API_PREFIX)
    app.include_router(admin_settings_router.router, prefix=_API_PREFIX)
    app.include_router(admin_ui_strings_router.router, prefix=_API_PREFIX)
    app.include_router(admin_services_router.router, prefix=_API_PREFIX)
    app.include_router(admin_pricing_router.router, prefix=_API_PREFIX)
    app.include_router(admin_vehicles_router.router, prefix=_API_PREFIX)
    app.include_router(admin_faqs_router.router, prefix=_API_PREFIX)
    app.include_router(admin_testimonials_router.router, prefix=_API_PREFIX)
    app.include_router(admin_legal_pages_router.router, prefix=_API_PREFIX)
    app.include_router(admin_dashboard_router.router, prefix=_API_PREFIX)
    app.include_router(admin_forms_router.router, prefix=_API_PREFIX)
    app.include_router(admin_uploads_router.router, prefix=_API_PREFIX)
    app.include_router(admin_audit_log_router.router, prefix=_API_PREFIX)
