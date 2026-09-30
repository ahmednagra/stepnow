# apps/backend/tests/test_managed_seed.py
# The managed-seed rule: a re-run seeder may only overwrite rows nobody edited since seeding, and
# demo seeders never run against production. Pure logic — no database.

from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from scripts import seed
from scripts.seeders._base import reconcile, seed_fingerprint

ACTOR = SimpleNamespace(id=uuid4())
SEED = {"value_de": "Jetzt buchen", "value_en": "Book now", "is_locked": False}


def _row(seed_hash, deleted_by=None, is_deleted=False, **values):
    return SimpleNamespace(id=uuid4(), seed_hash=seed_hash, is_deleted=is_deleted, deleted_by=deleted_by, **{**SEED, **values})


def test_row_matching_the_seed_is_unchanged():
    assert reconcile(_row(None), SEED, set(), ACTOR) == "same"


def test_unedited_row_follows_a_changed_seed():
    old = {**SEED, "value_de": "Buchen"}
    row = _row(seed_fingerprint(old), value_de="Buchen")
    assert reconcile(row, SEED, set(), ACTOR) == "update"


def test_admin_edit_is_kept():
    row = _row(seed_fingerprint(SEED), value_de="Jetzt Fahrt anfragen")
    assert reconcile(row, SEED, set(), ACTOR) == "kept"


def test_legacy_row_uses_the_audit_log():
    row = _row(None, value_de="Eigener Text")
    assert reconcile(row, SEED, {str(row.id)}, ACTOR) == "kept"
    assert reconcile(row, SEED, set(), ACTOR) == "update"


def test_deletion_by_admin_is_respected_but_seeder_deletion_is_revived():
    assert reconcile(_row(seed_fingerprint(SEED), is_deleted=True, deleted_by=uuid4()), SEED, set(), ACTOR) == "kept"
    assert reconcile(_row(seed_fingerprint(SEED), is_deleted=True, deleted_by=ACTOR.id), SEED, set(), ACTOR) == "update"


def test_fingerprint_ignores_decimal_scale():
    assert seed_fingerprint({"vat_rate": Decimal("0.07")}) == seed_fingerprint({"vat_rate": Decimal("0.0700")})


def test_reseeding_ui_strings_keeps_admin_edits(db, monkeypatch):
    # Against the isolated test schema. The seeder module bound SessionLocal at import time, so it
    # is re-pointed at the test engine explicitly — never the live database.
    import config.database as database
    from app.Models.ui_strings import UiString
    from scripts.seeders import seed_ui_strings

    monkeypatch.setattr(seed_ui_strings, "SessionLocal", database.SessionLocal)
    seed_ui_strings.run()
    live = lambda key: db.query(UiString).filter(UiString.key == key, UiString.is_deleted == False).one()  # noqa: E731
    edited, outdated = live("nav.home"), live("nav.contact")
    edited.value_de = "Start"  # an admin edit: values change, seed_hash does not
    old = {f: getattr(outdated, f) for f in seed_ui_strings.FIELDS} | {"value_en": "Get in touch"}
    outdated.value_en, outdated.seed_hash = "Get in touch", seed_fingerprint(old)  # written by an older seed
    db.commit()
    seed_ui_strings.run()
    db.expire_all()
    assert live("nav.home").value_de == "Start"
    assert live("nav.contact").value_en == "Contact"


@pytest.mark.parametrize("env", ["", "production", "PROD"])
def test_demo_seeders_refuse_production_or_unset_environment(monkeypatch, env):
    monkeypatch.setenv("ENVIRONMENT", env)
    with pytest.raises(RuntimeError, match="Demo seeders refused"):
        seed.run_all(include_demo=True)


def test_demo_seeders_allowed_in_dev(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "dev")
    assert seed.demo_refusal() is None


def test_reference_and_demo_groups_are_disjoint():
    assert not set(seed.REFERENCE_SEEDERS) & set(seed.DEMO_SEEDERS)
    assert {m.__name__.split(".")[-1] for m in seed.DEMO_SEEDERS} == {
        "seed_bookings", "seed_contact_messages", "seed_drivers", "seed_driver_vehicle_assignments", "seed_parcel_orders",
    }
