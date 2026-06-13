# apps/backend/app/Utils/finance.py
# Shared money + numbering helpers. Single home for the rounding rule, VAT math and the
# gapless sequential-number generator so orders/invoices never duplicate the logic.

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session

_CENTS = Decimal("0.01")


def money(value) -> Decimal:
    """Quantize to 2 dp, kaufmännisch rounding (ROUND_HALF_UP)."""
    return Decimal(str(value)).quantize(_CENTS, rounding=ROUND_HALF_UP)


def compute_totals(net, rate) -> tuple[Decimal, Decimal, Decimal]:
    """Return (net, vat, gross) all rounded to the cent."""
    net_d = money(net)
    vat_d = money(net_d * Decimal(str(rate)))
    return net_d, vat_d, money(net_d + vat_d)


def year_prefix(lead: str = "") -> str:
    """e.g. ''->'2026-', 'R'->'R2026-'."""
    return f"{lead}{date.today().year}-"


def next_sequence_number(db: Session, column, prefix: str, width: int = 5) -> str:
    """Gapless per-prefix sequence, e.g. '2026-00001'. Includes soft-deleted rows so a
    number is never reused (required for a clean Rechnungsnummer chain, §14 UStG)."""
    last = (
        db.query(column)
        .filter(column.like(f"{prefix}%"))
        .order_by(column.desc())
        .first()
    )
    seq = (int(last[0].rsplit("-", 1)[1]) + 1) if last else 1
    return f"{prefix}{seq:0{width}d}"


def order_date_sequence_number(db: Session, column, for_date: date | None = None) -> str:
    """Generate an order number matching the Buchhaltung format:
    counter(2) + DD(2) + MM(2) + YY(2)  →  e.g. '01260326'
    meaning: 1st order on 26.03.2026.

    counter = how many orders already exist on that date + 1 (padded to 2 digits).
    Includes soft-deleted rows so a number is never reused.
    """
    d = for_date or date.today()
    dd = str(d.day).zfill(2)
    mm = str(d.month).zfill(2)
    yy = str(d.year)[-2:]
    date_suffix = f"{dd}{mm}{yy}"

    # Count all existing orders whose number ends with this date suffix
    count = (
        db.query(column)
        .filter(column.like(f"%{date_suffix}"))
        .count()
    )
    counter = str(count + 1).zfill(2)
    return f"{counter}{date_suffix}"


def invoice_number_from_order(order_number: str) -> str:
    """Derive invoice number from order number: 'R' + order_number.
    e.g. '01260326' → 'R01260326'
    Matches Buchhaltung genRechnungNr(auftragsNr) = 'R' + auftragsNr.
    """
    return f"R{order_number}"
