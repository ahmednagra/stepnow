# apps/backend/app/Services/EmailTemplates.py
# Jinja2 renderer for transactional email bodies. Loads HTML (+ optional .txt twin)
# templates from app/Templates/email and renders them with the queued context PLUS
# a shared company/brand context pulled from settings. Falls back gracefully:
# - missing .txt twin  -> a plain-text body is auto-derived from the HTML
# - missing .html file -> caller can catch and use the legacy text builder
#
# Templates live in:  app/Templates/email/
#   base.html, driver_slip.html, customer_invoice.html, *.txt (optional twins)

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape

from config.settings import settings

# Templates directory (sits next to the app package). Adjust if your layout differs.
_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


@lru_cache(maxsize=1)
def _env() -> Environment:
    """Build the Jinja environment once. HTML autoescaped; .txt not."""
    return Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=select_autoescape(enabled_extensions=("html",), default_for_string=False),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def company_context() -> dict[str, Any]:
    """Brand/company variables for every template, read from site_settings — the same row the
    invoice PDF renders from, so an email and its own attachment can never quote different bank
    details. COMPANY_* env vars are a cold-start fallback only, used when the row is missing."""
    from datetime import datetime
    from config.database import SessionLocal
    from app.Models.settings import SiteSettings

    db = SessionLocal()
    try:
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    finally:
        db.close()

    bank = " · ".join(p for p in (
        f"IBAN {s.iban}" if s and s.iban else None,
        f"BIC {s.bic}" if s and s.bic else None,
        s.bank_account_holder if s and s.bank_account_holder else None,
    ) if p) if s else settings.COMPANY_BANK

    return {
        "brand_name": "StepNow",
        "brand_tagline": "Rides & Movers",
        "company_name": s.business_name if s else settings.COMPANY_NAME,
        "company_owner": f"{s.owner_name} {s.legal_form}".strip() if s else settings.COMPANY_OWNER,
        "company_street": s.address_street if s else settings.COMPANY_STREET,
        "company_city": f"{s.address_postcode} {s.address_city}".strip() if s else settings.COMPANY_CITY,
        "company_phone": s.phone if s else settings.COMPANY_PHONE,
        "company_bank": bank or settings.COMPANY_BANK,
        "company_tax_no": s.tax_number if s else settings.COMPANY_TAX_NO,
        "company_vat_id": s.vat_id if s else None,
        "support_email": s.email if s else settings.COMPANY_EMAIL,
        "current_year": datetime.now().year,
    }


_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\n[ \t]+")


def _html_to_text(html: str) -> str:
    """Crude HTML→text fallback used only when a .txt twin is absent."""
    text = re.sub(r"(?is)<(script|style).*?</\1>", "", html)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n\n", text)
    text = _TAG_RE.sub("", text)
    text = _WS_RE.sub("\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def render(template: str, context: dict[str, Any]) -> tuple[str, str]:
    """Render (html, text) for a template name like 'driver_slip'.

    Merges company_context() under the caller's context (caller wins on conflicts).
    Raises TemplateNotFound if the .html template is missing.
    """
    ctx = {**company_context(), **(context or {})}
    env = _env()

    html = env.get_template(f"{template}.html").render(**ctx)

    try:
        text = env.get_template(f"{template}.txt").render(**ctx)
    except TemplateNotFound:
        text = _html_to_text(html)

    return html, text


def template_exists(template: str) -> bool:
    try:
        _env().get_template(f"{template}.html")
        return True
    except TemplateNotFound:
        return False
