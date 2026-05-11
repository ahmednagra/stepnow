# apps/backend/app/Utils/i18n.py
from enum import Enum
from typing import Any
from fastapi import Header, Query


class Locale(str, Enum):
    DE = "de"
    EN = "en"


DEFAULT_LOCALE = Locale.DE


def localized_field(obj: Any, field: str, locale: Locale, fallback: Locale = DEFAULT_LOCALE) -> Any:
    primary = getattr(obj, f"{field}_{locale.value}", None)
    if primary:
        return primary
    return getattr(obj, f"{field}_{fallback.value}", None)


async def get_locale(locale: str | None = Query(None), accept_language: str | None = Header(None)) -> Locale:
    if locale in ("de", "en"):
        return Locale(locale)
    if accept_language and accept_language.lower().startswith("en"):
        return Locale.EN
    return Locale.DE
