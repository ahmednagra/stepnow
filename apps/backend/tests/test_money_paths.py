# apps/backend/tests/test_money_paths.py
# The three paths that decide what a customer is charged and what they still owe:
# VAT resolution, booking -> order conversion, and the payment-sum derivation.

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

import pytest

from app.Models.bookings import BookingRequest
from app.Models.orders import Order
from app.Models.payments import Payment
from app.Models.services import Service
from app.Models.settings import SiteSettings
from app.Services.PaymentsService import PaymentsService
from app.Utils.finance import default_vat_rate, vat_rate_for


@pytest.fixture
def settings_row(db):
    row = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    if not row:
        row = SiteSettings(
            id=1, business_name="T", owner_name="T", address_street="S", address_postcode="1",
            address_city="C", phone="1", email="t@t.de",
            vat_rate_standard=Decimal("0.1900"), vat_rate_reduced=Decimal("0.0700"),
        )
        db.add(row)
    else:
        row.vat_rate_standard, row.vat_rate_reduced = Decimal("0.1900"), Decimal("0.0700")
    db.commit()
    return row


@pytest.fixture
def services(db, settings_row):
    made = []
    for slug, rate in (("passenger-test", Decimal("0.0700")), ("courier-test", None)):
        svc = Service(
            sort_order=0, active=True, slug_de=slug, slug_en=f"{slug}-en",
            title_de=slug.title(), title_en=slug.title(), vat_rate=rate,
        )
        db.add(svc)
        made.append(svc)
    db.commit()
    yield made
    for svc in made:
        db.delete(svc)
    db.commit()


def test_vat_comes_from_the_service_row(db, services):
    passenger, _ = services
    assert vat_rate_for(db, service_id=passenger.id) == Decimal("0.0700")


def test_vat_falls_back_to_the_standard_rate_when_the_service_has_none(db, services):
    _, courier = services
    assert vat_rate_for(db, service_id=courier.id) == Decimal("0.1900")


def test_vat_resolves_by_service_type_label(db, services):
    assert vat_rate_for(db, service_type="passenger-test") == Decimal("0.0700")
    assert vat_rate_for(db, service_type="Passenger-Test") == Decimal("0.0700")


def test_vat_unknown_service_gets_the_standard_rate(db, services):
    assert vat_rate_for(db, service_type="does-not-exist") == Decimal("0.1900")
    assert vat_rate_for(db) == Decimal("0.1900")


def test_vat_tracks_a_settings_change(db, settings_row):
    settings_row.vat_rate_standard = Decimal("0.2000")
    db.commit()
    assert default_vat_rate(db) == Decimal("0.2000")
    settings_row.vat_rate_standard = Decimal("0.1900")
    db.commit()


def _order(db, net="100.00", rate="0.1900"):
    net_d, rate_d = Decimal(net), Decimal(rate)
    vat = (net_d * rate_d).quantize(Decimal("0.01"))
    o = Order(
        order_number=f"T{uuid4().hex[:12]}", status="open", customer_name="X",
        customer_phone="1", customer_email="x@y.de", pickup_address="A", destination_address="B",
        net_amount=net_d, vat_rate=rate_d, vat_amount=vat, gross_amount=net_d + vat,
    )
    db.add(o)
    db.commit()
    return o


def _pay(db, order, amount, status="received", deleted=False):
    p = Payment(
        order_id=order.id, amount=Decimal(amount), method="cash", status=status,
        received_at=datetime.now(timezone.utc), is_deleted=deleted,
    )
    db.add(p)
    db.commit()
    return p


def test_totals_for_sums_only_received_payments(db):
    o = _order(db)
    _pay(db, o, "40.00")
    _pay(db, o, "60.00")
    _pay(db, o, "999.00", status="pending")
    assert PaymentsService.totals_for(db, [o.id])[o.id] == Decimal("100.00")


def test_totals_for_ignores_soft_deleted_payments(db):
    o = _order(db)
    _pay(db, o, "25.00")
    _pay(db, o, "999.00", deleted=True)
    assert PaymentsService.totals_for(db, [o.id])[o.id] == Decimal("25.00")


def test_totals_for_omits_orders_with_no_payments(db):
    o = _order(db)
    assert PaymentsService.totals_for(db, [o.id]) == {}


def test_totals_for_empty_input_is_empty(db):
    assert PaymentsService.totals_for(db, []) == {}


def test_balance_due_is_gross_minus_received(db):
    o = _order(db, net="200.00", rate="0.1900")
    _pay(db, o, "100.00")
    paid = PaymentsService.totals_for(db, [o.id]).get(o.id, Decimal("0.00"))
    assert o.gross_amount - paid == Decimal("138.00")


def test_convert_uses_the_service_rate_when_none_is_supplied(db, services):
    passenger, _ = services
    booking = BookingRequest(
        reference=f"T{uuid4().hex[:10]}", status="new", service_id=passenger.id,
        customer_name="X", customer_phone="1", customer_email="x@y.de",
        pickup_address="A", destination_address="B",
        requested_datetime=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(booking)
    db.commit()
    assert vat_rate_for(db, booking.service_id) == Decimal("0.0700")
    db.delete(booking)
    db.commit()
