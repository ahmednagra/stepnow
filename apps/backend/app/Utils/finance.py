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


BOOKING_PREFIX = "B"
ORDER_PREFIX = "P"
INVOICE_PREFIX = "R"


def next_job_core(db: Session, for_date: date | None = None) -> str:
    """The digits every document for one job shares: order-of-day + DDMMYY. Claimed once, by
    whichever document opens the job, then carried unchanged by the order and the invoice."""
    suffix = date_suffix(for_date)
    return f"{next_counter(db, 'job', suffix):02d}{suffix}"


def job_core(number: str) -> str:
    """Strip the document prefix and any revision back to the shared core. Tolerates the legacy
    prefix-without-dash form ('P02130826') so old rows still resolve."""
    core = number.split("-", 1)[1] if "-" in number else (number[1:] if number[:1].isalpha() else number)
    return core.split("-", 1)[0]


def document_number(prefix: str, core: str, revision: int = 0) -> str:
    return f"{prefix}-{core}" if revision <= 0 else f"{prefix}-{core}-{revision}"


def booking_reference(db: Session, for_date: date | None = None) -> str:
    return document_number(BOOKING_PREFIX, next_job_core(db, for_date))


def order_date_sequence_number(db: Session, for_date: date | None = None, core: str | None = None) -> str:
    """Format: P-{order-of-day}{DDMMYY}, e.g. 'P-45260826' = 45th job of 26.08.26. Pass `core`
    when the job already has digits (booking -> order) so they carry through unchanged."""
    return document_number(ORDER_PREFIX, core or next_job_core(db, for_date))


def sync_customer_counter(db: Session, prefix: str = "K911") -> None:
    """Legacy imports write explicit Kunden-Nr., which never touches the counter. Raise it past the
    highest number in use so the next claim starts beyond them."""
    db.execute(
        text(
            'INSERT INTO counters (scope, "key", value) '
            "SELECT 'customer', :p, MAX(CAST(substring(customer_number from :n) AS bigint)) "
            "FROM customers WHERE customer_number ~ :rx "
            "HAVING MAX(CAST(substring(customer_number from :n) AS bigint)) IS NOT NULL "
            'ON CONFLICT (scope, "key") DO UPDATE SET value = GREATEST(counters.value, EXCLUDED.value)'
        ),
        {"p": prefix, "n": len(prefix) + 1, "rx": f"^{prefix}[0-9]+$"},
    )


def next_customer_number(db: Session, prefix: str = "K911", width: int = 3) -> str:
    """An explicitly-numbered row bypasses the counter, so a freshly claimed value can already be
    taken. Skip past any that are — the counter only ever moves forward, never reissues."""
    from app.Models.customers import Customer

    while True:
        candidate = f"{prefix}{next_counter(db, 'customer', prefix):0{width}d}"
        if not db.query(Customer.id).filter(
            Customer.customer_number == candidate, Customer.is_deleted == False  # noqa: E712
        ).first():
            return candidate


def invoice_number_from_order(order_number: str, revision: int = 0) -> str:
    """The invoice carries its order's digits: P-45260826 -> R-45260826, so a payment matches a job
    without a lookup. A replacement issued after a Storno appends '-{revision}' — a cancelled
    number is never reissued (§14 UStG)."""
    return document_number(INVOICE_PREFIX, job_core(order_number), revision)


def next_invoice_number(db: Session, order_number: str) -> str:
    return invoice_number_from_order(order_number, next_counter(db, "invoice", order_number) - 1)
