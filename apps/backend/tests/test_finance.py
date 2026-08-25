# apps/backend/tests/test_finance.py
# Money, VAT and the numbering formats. Pure logic — no database required.

from datetime import date
from decimal import Decimal

import pytest

from app.Utils.finance import compute_totals, date_suffix, invoice_number_from_order, money


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("10", "10.00"),
        ("10.004", "10.00"),
        ("10.005", "10.01"),
        ("10.015", "10.02"),
        ("-0.005", "-0.01"),
        (Decimal("123.456"), "123.46"),
        (0.1 + 0.2, "0.30"),
    ],
)
def test_money_rounds_half_up_to_cents(raw, expected):
    assert money(raw) == Decimal(expected)


def test_money_returns_decimal_not_float():
    assert isinstance(money(1.1), Decimal)


@pytest.mark.parametrize(
    "net,rate,vat,gross",
    [
        ("100.00", "0.1900", "19.00", "119.00"),
        ("100.00", "0.0700", "7.00", "107.00"),
        ("0.00", "0.1900", "0.00", "0.00"),
        ("33.33", "0.1900", "6.33", "39.66"),
        ("1234.56", "0.0700", "86.42", "1320.98"),
    ],
)
def test_compute_totals(net, rate, vat, gross):
    n, v, g = compute_totals(Decimal(net), Decimal(rate))
    assert (n, v, g) == (Decimal(net), Decimal(vat), Decimal(gross))


def test_compute_totals_gross_always_equals_net_plus_vat():
    for cents in range(0, 2000, 7):
        net = Decimal(cents) / Decimal(100)
        n, v, g = compute_totals(net, Decimal("0.1900"))
        assert g == n + v


def test_date_suffix_is_ddmmyy():
    assert date_suffix(date(2026, 3, 26)) == "260326"
    assert date_suffix(date(2026, 12, 1)) == "011226"


def test_invoice_number_derives_from_order():
    assert invoice_number_from_order("01260326") == "R01260326"


def test_invoice_number_revisions_never_collide():
    numbers = {invoice_number_from_order("01260326", r) for r in range(5)}
    assert len(numbers) == 5
    assert invoice_number_from_order("01260326", 1) == "R01260326-1"
