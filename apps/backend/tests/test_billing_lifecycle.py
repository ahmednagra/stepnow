# apps/backend/tests/test_billing_lifecycle.py
# Order → invoice → payment against a real database: payments settle the right bill for the right
# amount, refunds un-settle, issued documents are frozen, and a Storno hands over to its replacement.

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.Core.Exceptions import ConflictError, NotFoundError
from app.Http.Controllers.admin.OrdersController import OrdersController
from app.Models.bookings import BookingRequest
from app.Models.orders import Order
from app.Models.settings import SiteSettings
from app.Schemas.admin.orders_admin import InvoiceCreateFromOrder, InvoiceItemInput, InvoiceUpdate, OrderCreateFromBooking, PaymentCreate
from app.Services.CourierOrdersService import CourierOrdersService
from app.Services.InvoicesService import InvoicesService
from app.Services.OrdersService import OrdersService
from app.Services.PaymentsService import PaymentsService
import app.Services.InvoicePdfService as invoice_pdf

ACTOR = SimpleNamespace(id=None, email=None)
RECIPIENT = "Muster Spedition GmbH\nHauptstr. 1\n73779 Deizisau"


@pytest.fixture(autouse=True)
def pdf_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(invoice_pdf, "STORAGE_DIR", tmp_path)
    return tmp_path


@pytest.fixture(autouse=True)
def issuer(db):
    row = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    if not row:
        row = SiteSettings(
            id=1, business_name="T", owner_name="T", address_street="S", address_postcode="1",
            address_city="C", phone="1", email="t@t.de",
            vat_rate_standard=Decimal("0.1900"), vat_rate_reduced=Decimal("0.0700"),
        )
        db.add(row)
    row.tax_number = row.tax_number or "59002/59899"
    db.commit()
    return row


def _order(db, net="100.00", rate="0.1900") -> Order:
    net_d, rate_d = Decimal(net), Decimal(rate)
    vat = (net_d * rate_d).quantize(Decimal("0.01"))
    o = Order(
        order_number=f"A-T{uuid4().hex[:12]}", status="open", customer_name="X",
        customer_phone="1", customer_email="x@y.de", pickup_address="A", destination_address="B",
        net_amount=net_d, vat_rate=rate_d, vat_amount=vat, gross_amount=net_d + vat, payment_due_days=14,
    )
    db.add(o)
    db.commit()
    return o


def _invoice(db, order, issue=True, items=None):
    inv = InvoicesService.create_from_order(db, order.id, InvoiceCreateFromOrder(recipient_block=RECIPIENT), ACTOR)
    if items:
        InvoicesService.update(db, inv.id, InvoiceUpdate(items=items), ACTOR)
    return InvoicesService.issue(db, inv.id, ACTOR) if issue else inv


def _pay(db, order, amount, invoice_id=None):
    return PaymentsService.record(db, order.id, PaymentCreate(amount=Decimal(amount), invoice_id=invoice_id), ACTOR)


def test_payment_against_another_orders_invoice_is_refused(db):
    mine, other = _order(db), _order(db)
    foreign = _invoice(db, other)
    with pytest.raises(ConflictError):
        _pay(db, mine, "10.00", invoice_id=foreign.id)


def test_payment_against_a_cancelled_invoice_is_refused(db):
    o = _order(db)
    inv = _invoice(db, o)
    InvoicesService.cancel(db, inv.id, ACTOR)
    with pytest.raises(ConflictError):
        _pay(db, o, "10.00", invoice_id=inv.id)


def test_overpayment_is_refused(db):
    o = _order(db)
    _invoice(db, o)
    with pytest.raises(ConflictError):
        _pay(db, o, "119.01")


def test_invoice_is_paid_against_its_own_gross_including_charges(db):
    o = _order(db)  # order gross 119.00
    inv = _invoice(db, o, items=[InvoiceItemInput(kind="charge", label="Wartezeit", net_amount=Decimal("20.00"))])
    assert inv.gross_amount == Decimal("142.80")
    p = _pay(db, o, "119.00")
    assert p.invoice_id == inv.id  # no invoice_id given → linked to the live bill
    assert (inv.status, o.status) == ("issued", "open")
    _pay(db, o, "23.80")
    assert (inv.status, o.status) == ("paid", "completed")
    assert inv.paid_at is not None


def test_refund_reverts_paid_and_completed(db):
    o = _order(db)
    inv = _invoice(db, o)
    p = _pay(db, o, "119.00")
    assert (inv.status, o.status) == ("paid", "completed")
    PaymentsService.set_status(db, p.id, "refunded", ACTOR)
    assert (inv.status, o.status, inv.paid_at, o.completed_at) == ("issued", "open", None, None)
    with pytest.raises(ConflictError):
        PaymentsService.set_status(db, p.id, "received", ACTOR)  # refunded is terminal


def test_money_edit_is_blocked_after_issue(db):
    o = _order(db)
    _invoice(db, o)
    payload = SimpleNamespace(vat_rate=None, net_amount=Decimal("250.00"), payment_due_days=14)
    with pytest.raises(ConflictError):
        CourierOrdersService.update_fields(db, o.id, payload, ACTOR, None)
    assert o.net_amount == Decimal("100.00")


def test_soft_deleted_order_is_not_editable_or_payable(db):
    o = _order(db)
    OrdersService.soft_delete(db, o.id, ACTOR, None)
    with pytest.raises(NotFoundError):
        OrdersService.get(db, o.id)
    with pytest.raises(NotFoundError):
        CourierOrdersService.update_fields(db, o.id, SimpleNamespace(), ACTOR, None)
    with pytest.raises(NotFoundError):
        _pay(db, o, "1.00")
    assert OrdersService.get(db, o.id, allow_deleted=True).is_deleted


def test_order_with_an_issued_invoice_cannot_be_deleted(db):
    o = _order(db)
    _invoice(db, o)
    with pytest.raises(ConflictError):
        OrdersService.soft_delete(db, o.id, ACTOR, None)


def test_issue_requires_a_recipient_address(db):
    o = _order(db)
    inv = InvoicesService.create_from_order(db, o.id, InvoiceCreateFromOrder(), ACTOR)
    InvoicesService.update(db, inv.id, InvoiceUpdate(recipient_block="Only A Name"), ACTOR)
    with pytest.raises(ConflictError):
        InvoicesService.issue(db, inv.id, ACTOR)
    assert inv.status == "draft"


def test_issue_stamps_today_and_freezes_the_pdf(db, pdf_dir):
    o = _order(db)
    inv = InvoicesService.create_from_order(
        db, o.id, InvoiceCreateFromOrder(recipient_block=RECIPIENT, issue_date=datetime.now().date() - timedelta(days=9)), ACTOR,
    )
    InvoicesService.issue(db, inv.id, ACTOR)
    assert inv.issue_date == datetime.now().date()
    assert OrdersController._pdf_path(db, inv).endswith(f"{inv.invoice_number}.pdf")
    (pdf_dir / f"{inv.invoice_number}.pdf").unlink()
    with pytest.raises(NotFoundError):  # never silently re-rendered from today's data
        OrdersController._pdf_path(db, inv)


def test_storno_hands_over_to_a_numbered_replacement(db):
    o = _order(db)
    first = _invoice(db, o, items=[InvoiceItemInput(kind="charge", label="Wartezeit", net_amount=Decimal("10.00"))])
    p = _pay(db, o, "50.00")
    InvoicesService.cancel(db, first.id, ACTOR, reason="Falscher Empfänger")
    assert first.status == "cancelled" and o.current_invoice is None
    db.refresh(p)
    assert p.invoice_id is None  # payment kept on the order as credit
    replacement = InvoicesService.create_from_order(db, o.id, InvoiceCreateFromOrder(), ACTOR)
    assert replacement.invoice_number == f"{first.invoice_number}-1"
    assert o.current_invoice is replacement
    assert [i.id for i in o.invoices] == [first.id, replacement.id]
    assert (replacement.recipient_block, replacement.gross_amount) == (RECIPIENT, first.gross_amount)
    db.refresh(p)
    assert p.invoice_id == replacement.id
    assert PaymentsService.invoice_received_total(db, replacement.id) == Decimal("50.00")


def test_cancel_freezes_a_stornorechnung_with_negated_totals(db, pdf_dir):
    pypdf = pytest.importorskip("pypdf")
    o = _order(db)  # net 100.00, VAT 19.00, gross 119.00
    inv = _invoice(db, o)
    InvoicesService.cancel(db, inv.id, ACTOR)
    path = OrdersController.storno_pdf_path_by_id(db, inv.id)
    assert path.endswith(f"{inv.invoice_number}-STORNO.pdf")
    text = "".join(page.extract_text() for page in pypdf.PdfReader(path).pages)
    for expected in ("Stornorechnung", f"{inv.invoice_number}-STORNO", f"Storno zu Rechnung {inv.invoice_number}",
                     "-100,00", "-19,00", "-119,00"):
        assert expected in text, expected
    assert "Zahlungsbedingungen" not in text
    assert (pdf_dir / f"{inv.invoice_number}.pdf").exists()  # the original Beleg is untouched
    (pdf_dir / f"{inv.invoice_number}-STORNO.pdf").unlink()
    with pytest.raises(NotFoundError):  # frozen: never re-rendered
        OrdersController.storno_pdf_path_by_id(db, inv.id)


def test_draft_cannot_be_cancelled(db):
    o = _order(db)
    inv = _invoice(db, o, issue=False)
    with pytest.raises(ConflictError):
        InvoicesService.cancel(db, inv.id, ACTOR)


def test_cancelled_booking_cannot_be_converted(db):
    booking = BookingRequest(
        reference=f"T{uuid4().hex[:10]}", status="cancelled", customer_name="X", customer_phone="1",
        customer_email="x@y.de", pickup_address="A", destination_address="B",
        requested_datetime=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(booking)
    db.commit()
    with pytest.raises(ConflictError):
        OrdersService.create_from_booking(db, booking.id, OrderCreateFromBooking(net_amount=Decimal("10.00")), ACTOR)


def test_bills_list_renders_every_invoice_with_its_currency(db):
    order = _order(db)
    inv = _invoice(db, order)
    page = OrdersController.list_invoices(db, 1, 100, None, None)
    row = next(r for r in page.items if r.id == inv.id)
    assert row.currency == inv.currency and row.gross_amount == inv.gross_amount
    assert row.balance_due == inv.gross_amount and row.is_overdue is False
