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
