# apps/backend/tests/test_invoices.py
# Invoice totals and the draft/issue/cancel lifecycle. The recompute tests are pure logic;
# the lifecycle tests need a database and skip without one.

from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.Core.Exceptions import ConflictError
from app.Services.InvoicesService import InvoicesService


def _item(kind, amount):
    return SimpleNamespace(kind=kind, net_amount=Decimal(amount), is_deleted=False)


def _invoice(base_net, rate, items):
    return SimpleNamespace(
        base_net=Decimal(base_net), vat_rate=Decimal(rate), items=items,
        net_amount=None, vat_amount=None, gross_amount=None,
    )


def test_recompute_charges_add_and_discounts_subtract():
    inv = _invoice("100.00", "0.1900", [_item("charge", "20.00"), _item("discount", "5.00")])
    InvoicesService._recompute(inv)
    assert inv.net_amount == Decimal("115.00")
    assert inv.vat_amount == Decimal("21.85")
    assert inv.gross_amount == Decimal("136.85")


def test_recompute_ignores_soft_deleted_items():
    deleted = _item("charge", "999.00")
    deleted.is_deleted = True
    inv = _invoice("50.00", "0.0700", [deleted, _item("charge", "10.00")])
    InvoicesService._recompute(inv)
    assert inv.net_amount == Decimal("60.00")
    assert inv.gross_amount == Decimal("64.20")


def test_recompute_with_no_items_is_base_net():
    inv = _invoice("80.00", "0.1900", [])
    InvoicesService._recompute(inv)
    assert (inv.net_amount, inv.vat_amount, inv.gross_amount) == (Decimal("80.00"), Decimal("15.20"), Decimal("95.20"))


def test_recompute_discount_can_reach_zero():
    inv = _invoice("40.00", "0.1900", [_item("discount", "40.00")])
    InvoicesService._recompute(inv)
    assert inv.net_amount == Decimal("0.00")
    assert inv.gross_amount == Decimal("0.00")


@pytest.mark.parametrize("status", ["issued", "paid", "cancelled"])
def test_update_refuses_once_the_invoice_leaves_draft(monkeypatch, status):
    inv = SimpleNamespace(id="x", status=status)
    monkeypatch.setattr(InvoicesService, "get", staticmethod(lambda db, invoice_id: inv))
    with pytest.raises(ConflictError):
        InvoicesService.update(None, "x", SimpleNamespace(model_dump=lambda **_: {}), None, None)


@pytest.mark.parametrize("status", ["issued", "paid", "cancelled"])
def test_issue_refuses_a_non_draft(monkeypatch, status):
    inv = SimpleNamespace(id="x", status=status)
    monkeypatch.setattr(InvoicesService, "get", staticmethod(lambda db, invoice_id: inv))
    with pytest.raises(ConflictError):
        InvoicesService.issue(None, "x", None, None)


@pytest.mark.parametrize("status", ["draft", "cancelled"])
def test_cancel_refuses_a_draft_or_an_already_cancelled_invoice(monkeypatch, status):
    inv = SimpleNamespace(id="x", status=status)
    monkeypatch.setattr(InvoicesService, "get", staticmethod(lambda db, invoice_id: inv))
    with pytest.raises(ConflictError):
        InvoicesService.cancel(None, "x", None, None)
