# apps/backend/app/Utils/finance.py
# Money rounding, VAT resolution and the gapless number generators. No rate or status is
# hardcoded here — VAT comes from services.vat_rate, falling back to site_settings.

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID
from sqlalchemy import or_, text
from sqlalchemy.orm import Session


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_totals(net, rate) -> tuple[Decimal, Decimal, Decimal]:
    net_d = money(net)
    vat_d = money(net_d * Decimal(str(rate)))
    return net_d, vat_d, money(net_d + vat_d)


def default_vat_rate(db: Session, reduced: bool = False) -> Decimal:
    from app.Models.settings import SiteSettings

    column = SiteSettings.vat_rate_reduced if reduced else SiteSettings.vat_rate_standard
    return db.query(column).filter(SiteSettings.id == 1).scalar() or Decimal("0")


def default_currency(db: Session) -> str:
    """The ISO 4217 the business bills in. Never a literal — admin-editable in Settings."""
    from app.Models.settings import SiteSettings

    return db.query(SiteSettings.default_currency).filter(SiteSettings.id == 1).scalar() or "EUR"


def vat_rate_for(db: Session, service_id: UUID | None = None, service_type: str | None = None) -> Decimal:
    """Resolve the rate from the service catalog; fall back to the configured standard rate.
    Nothing about which service is 7% and which is 19% lives in code."""
    from app.Models.services import Service

    query = db.query(Service.vat_rate).filter(Service.is_deleted == False, Service.vat_rate.isnot(None))  # noqa: E712
    if service_id:
        rate = query.filter(Service.id == service_id).scalar()
        if rate is not None:
            return rate
    label = (service_type or "").strip()
    if label:
        rate = query.filter(
            or_(Service.slug_de == label, Service.slug_en == label,
                Service.title_de.ilike(label), Service.title_en.ilike(label))
        ).scalar()
        if rate is not None:
            return rate
    return default_vat_rate(db)


def next_counter(db: Session, scope: str, key: str) -> int:
    """Atomically claim the next number for (scope, key). One statement — race-free, never reuses."""
    return db.execute(
        text(
            'INSERT INTO counters (scope, "key", value) VALUES (:s, :k, 1) '
            'ON CONFLICT (scope, "key") DO UPDATE SET value = counters.value + 1 RETURNING value'
        ),
        {"s": scope, "k": key},
    ).scalar_one()


def date_suffix(for_date: date | None = None) -> str:
    d = for_date or date.today()
    return f"{d.day:02d}{d.month:02d}{str(d.year)[-2:]}"


ORDER_PREFIX = "P"
INVOICE_PREFIX = "R"


def order_date_sequence_number(db: Session, for_date: date | None = None) -> str:
    """Format: P + counter(2) + DD + MM + YY, e.g. 'P02130826' = 2nd order on 13.08.2026.
    The letter is part of the stored number, so nothing downstream re-prefixes it."""
    suffix = date_suffix(for_date)
    return f"{ORDER_PREFIX}{next_counter(db, 'order', suffix):02d}{suffix}"


def next_customer_number(db: Session, prefix: str = "K911", width: int = 3) -> str:
    return f"{prefix}{next_counter(db, 'customer', prefix):0{width}d}"


def invoice_number_from_order(order_number: str, revision: int = 0) -> str:
    """Swap the order's letter for the invoice one: P02130826 -> R02130826. A replacement issued
    after a Storno appends '-{revision}' so a cancelled number is never reissued (§14 UStG)."""
    core = order_number.lstrip(ORDER_PREFIX) if order_number[:1].isalpha() else order_number
    base = f"{INVOICE_PREFIX}{core}"
    return base if revision <= 0 else f"{base}-{revision}"


def next_invoice_number(db: Session, order_number: str) -> str:
    return invoice_number_from_order(order_number, next_counter(db, "invoice", order_number) - 1)
