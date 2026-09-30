# apps/backend/tests/test_security.py
# Client-IP trust, rate-limit keying, login throttling/timing and PDF markup escaping.
# Pure logic + in-memory limiter; no database needed.

from datetime import date, datetime, time
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.testclient import TestClient

import app.Services.AuthService as auth_mod
import app.Services.DriverSlipPdfService as slip_mod
import app.Services.InvoicePdfService as invoice_mod
import app.Services.VehicleLedgerPdfService as ledger_mod
from app.Core.Exceptions import AuthError, RateLimitError
from app.Utils.client_ip import client_ip, parse_networks, resolve_client_ip
from app.Utils.pdf import esc, esc_lines, safe_filename
from app.Utils.rate_limit import LoginThrottle, limiter

LOOPBACK = parse_networks("127.0.0.1,::1")
EVIL = '<img src="x"> & </para> <b>'


# ── client IP resolution ──

def test_spoofed_forwarded_for_from_untrusted_peer_is_ignored():
    assert resolve_client_ip("203.0.113.9", "1.1.1.1", LOOPBACK) == "203.0.113.9"


def test_trusted_proxy_forwarded_for_is_respected():
    assert resolve_client_ip("127.0.0.1", "198.51.100.7", LOOPBACK) == "198.51.100.7"


def test_rightmost_untrusted_hop_wins_over_client_supplied_leftmost():
    # Client typed "1.1.1.1"; nginx appended the real address it saw.
    assert resolve_client_ip("127.0.0.1", "1.1.1.1, 198.51.100.7", LOOPBACK) == "198.51.100.7"
    assert resolve_client_ip("::1", "198.51.100.7, 127.0.0.1", LOOPBACK) == "198.51.100.7"


def test_malformed_or_missing_forwarded_for_falls_back_to_peer():
    assert resolve_client_ip("127.0.0.1", "not-an-ip", LOOPBACK) == "127.0.0.1"
    assert resolve_client_ip("127.0.0.1", "1.1.1.1, garbage", LOOPBACK) == "127.0.0.1"
    assert resolve_client_ip("127.0.0.1", None, LOOPBACK) == "127.0.0.1"


def test_ipv4_mapped_addresses_are_normalized():
    assert resolve_client_ip("127.0.0.1", "::ffff:198.51.100.7", LOOPBACK) == "198.51.100.7"


def test_client_ip_reads_request_scope():
    scope = {"type": "http", "client": ("127.0.0.1", 5000), "headers": [(b"x-forwarded-for", b"198.51.100.7")]}
    assert client_ip(Request(scope)) == "198.51.100.7"


# ── limiter keying (end to end through slowapi) ──

# slowapi registers limits per endpoint name, so the probe app is built once at import.
_limited_app = FastAPI()
_limited_app.state.limiter = limiter


@_limited_app.exception_handler(RateLimitExceeded)
async def _rate_limited(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"error": {"code": "RATE_LIMITED"}})


@_limited_app.post("/probe")
@limiter.limit("1/minute")
async def _probe(request: Request):
    return {"ok": True}


@pytest.fixture
def limited_app():
    limiter.reset()
    yield _limited_app
    limiter.reset()


def test_limiter_keys_differ_for_two_forwarded_client_ips(limited_app):
    bff = TestClient(limited_app, client=("127.0.0.1", 40000))
    assert bff.post("/probe", headers={"X-Forwarded-For": "198.51.100.1"}).status_code == 200
    assert bff.post("/probe", headers={"X-Forwarded-For": "198.51.100.2"}).status_code == 200
    assert bff.post("/probe", headers={"X-Forwarded-For": "198.51.100.1"}).status_code == 429


def test_untrusted_caller_cannot_rotate_forwarded_for_to_dodge_limit(limited_app):
    direct = TestClient(limited_app, client=("203.0.113.9", 40000))
    assert direct.post("/probe", headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 200
    assert direct.post("/probe", headers={"X-Forwarded-For": "10.0.0.2"}).status_code == 429


# ── login throttle + timing ──

class _NoUserDB:
    def query(self, *_):
        return self

    def filter(self, *_):
        return self

    def first(self):
        return None

    def add(self, _):
        pass

    def commit(self):
        pass


def test_login_throttle_counts_failures_and_success_clears():
    t = LoginThrottle("2/minute", "memory://")
    assert not t.blocked("a@x.de")
    t.failed("a@x.de")
    t.failed("a@x.de")
    assert t.blocked("a@x.de")
    assert not t.blocked("b@x.de")
    t.succeeded("a@x.de")
    assert not t.blocked("a@x.de")


def test_unknown_email_still_runs_bcrypt_and_is_throttled(monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(auth_mod, "verify_password", lambda pw, h: calls.append(h) or False)
    monkeypatch.setattr(auth_mod, "login_throttle", LoginThrottle("2/minute", "memory://"))
    for _ in range(2):
        with pytest.raises(AuthError):
            auth_mod.AuthService.login(_NoUserDB(), "Nobody@StepNow.de", "guess")
    assert calls == [auth_mod._DUMMY_HASH, auth_mod._DUMMY_HASH]
    with pytest.raises(RateLimitError):
        auth_mod.AuthService.login(_NoUserDB(), "nobody@stepnow.de ", "guess")
    assert len(calls) == 2


# ── PDF escaping ──

def test_escape_helpers():
    assert esc(EVIL) == '&lt;img src="x"&gt; &amp; &lt;/para&gt; &lt;b&gt;'
    assert esc(None) == ""
    assert esc_lines("a<b\nc") == "a&lt;b<br/>c"
    assert safe_filename("../../etc/passwd") == "etc_passwd"
    assert safe_filename("S-AB 123") == "S-AB_123"
    assert safe_filename("///", "fallback") == "fallback"


@pytest.fixture
def captured(monkeypatch, tmp_path):
    """Record every Paragraph's markup and render into a temp dir."""
    texts: list[str] = []
    for mod in (slip_mod, invoice_mod, ledger_mod):
        base = mod.Paragraph

        class _Rec(base):
            def __init__(self, text, *a, **k):
                texts.append(text)
                super().__init__(text, *a, **k)

        monkeypatch.setattr(mod, "Paragraph", _Rec)
        monkeypatch.setattr(mod, "STORAGE_DIR", tmp_path)
    return texts


def _stop(kind):
    return SimpleNamespace(
        stop_type=kind, is_deleted=False, company=EVIL, address=EVIL, postcode="73779", city=EVIL,
        stop_date=date(2026, 9, 1), time_from=time(7), time_to=time(8), package_count=2,
        weight_kg=Decimal("10"), notes=f"{EVIL}\nzweite Zeile",
    )


def _order():
    return SimpleNamespace(
        id=uuid4(), order_number="A-45260826", preferred_date=date(2026, 9, 1), scheduled_datetime=None,
        created_at=datetime(2026, 9, 1), customer_id=None, company_name=EVIL, customer_name=EVIL,
        service_description=f"{EVIL}\nline 2", client_reference=EVIL, stops=[_stop("pickup"), _stop("drop")],
        pickup_address=EVIL, pickup_postcode=None, pickup_city=EVIL, destination_address=EVIL,
        destination_postcode=None, destination_city=EVIL, parcel_quantity=None, parcel_weight_kg=None,
        vehicle_name=EVIL, driver_name=EVIL, km_to_load=None, km_to_unload=None, total_km=None, occupied_km=None,
        payment_due_days=14, due_date=date(2026, 9, 15), net_amount=Decimal("295.00"), currency="EUR",
        driver_slip_pdf_url=None, gross_amount=Decimal("351.05"), customer=SimpleNamespace(customer_number="K911053"),
    )


def _assert_no_raw_injection(texts):
    joined = "\n".join(texts)
    assert "<img" not in joined and "</para>" not in joined
    assert "&lt;img" in joined


def test_driver_copy_has_no_price_and_escapes_user_text(captured):
    order = _order()
    path = slip_mod.DriverSlipPdfService.render(_NoUserDB(), order)
    assert path.endswith("Transportauftrag_A-45260826_Fahrer.pdf")
    joined = "\n".join(captured)
    assert "295" not in joined and "Transportpreis" not in joined
    assert "Lieferadresse:" in joined
    _assert_no_raw_injection(captured)


def test_priced_copy_is_a_separate_file_without_double_currency(captured):
    order = _order()
    priced = slip_mod.DriverSlipPdfService.render(_NoUserDB(), order, with_price=True)
    driver = slip_mod.DriverSlipPdfService.render(_NoUserDB(), order)
    assert priced != driver
    joined = "\n".join(captured)
    assert "295,00" in joined and "Euro" not in joined


def test_invoice_pdf_renders_hostile_text(captured):
    order = _order()
    item = SimpleNamespace(kind="charge", net_amount=Decimal("10.00"), is_deleted=False, label=EVIL)
    invoice = SimpleNamespace(
        currency="EUR", order=order, tax_number=EVIL, invoice_number="R-45260826", recipient_block=f"{EVIL}\nStraße 1",
        issue_date=date(2026, 9, 1), vat_rate=Decimal("0.1900"), base_net=Decimal("295.00"), items=[item],
        net_amount=Decimal("305.00"), vat_amount=Decimal("57.95"), gross_amount=Decimal("362.95"),
        skonto_pct=None, skonto_days=None, payment_due_days=14, due_date=date(2026, 9, 15),
    )
    assert invoice_mod.InvoicePdfService.render(_NoUserDB(), invoice).endswith("R-45260826.pdf")
    _assert_no_raw_injection(captured)


def test_ledger_pdf_renders_hostile_text_and_sanitizes_plate(captured, tmp_path):
    vehicle = SimpleNamespace(id=uuid4(), plate="../../ES <x> 1", name_de=EVIL)
    totals = {"net": Decimal("295"), "gross": Decimal("351.05"), "paid": Decimal("0"), "balance": Decimal("351.05"), "count": 1}
    path = ledger_mod.VehicleLedgerPdfService.render(_NoUserDB(), vehicle, [(_order(), Decimal("0"), Decimal("351.05"))], totals)
    assert path == str(tmp_path / "Fahrzeugkonto_ES_x_1.pdf")
    _assert_no_raw_injection(captured)
