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
    """Shared brand/company variables every template can rely on."""
    from datetime import datetime

    return {
        "brand_name": "StepNow",
        "brand_tagline": "Rides & Movers",
        "company_name": settings.COMPANY_NAME,
        "company_owner": settings.COMPANY_OWNER,
        "company_street": settings.COMPANY_STREET,
        "company_city": settings.COMPANY_CITY,
        "company_phone": settings.COMPANY_PHONE,
        "company_bank": settings.COMPANY_BANK,
        "support_email": settings.COMPANY_EMAIL,
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
