# apps/backend/tests/test_counters.py
# The number generators. These need a database: the guarantee under test is that the
# INSERT ... ON CONFLICT DO UPDATE claim is atomic, which cannot be exercised in memory.

from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pytest
from sqlalchemy import text

from app.Utils.finance import (
    ORDER_PREFIX,
    next_counter,
    next_customer_number,
    next_invoice_number,
    order_date_sequence_number,
)


@pytest.fixture
def scope(db):
    name = "test_scope"
    db.execute(text("DELETE FROM counters WHERE scope = :s"), {"s": name})
    db.commit()
    yield name
    db.execute(text("DELETE FROM counters WHERE scope = :s"), {"s": name})
    db.commit()


def test_counter_starts_at_one_and_increments(db, scope):
    assert [next_counter(db, scope, "k") for _ in range(3)] == [1, 2, 3]


def test_counters_are_independent_per_key(db, scope):
    assert next_counter(db, scope, "a") == 1
    assert next_counter(db, scope, "b") == 1
    assert next_counter(db, scope, "a") == 2


def test_concurrent_claims_never_collide(db_engine, scope):
    from config.database import SessionLocal

    def claim(_):
        session = SessionLocal()
        try:
            value = next_counter(session, scope, "race")
            session.commit()
            return value
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=8) as pool:
        values = list(pool.map(claim, range(40)))
    assert sorted(values) == list(range(1, 41))


def test_order_number_format_and_uniqueness(db):
    when = date(2026, 3, 26)
    first = order_date_sequence_number(db, when)
    second = order_date_sequence_number(db, when)
    db.commit()
    assert first.startswith(ORDER_PREFIX) and second.startswith(ORDER_PREFIX)
    assert first.endswith("260326") and second.endswith("260326")
    assert first != second
    counter = lambda n: int(n[len(ORDER_PREFIX):-6])
    assert counter(second) == counter(first) + 1


def test_invoice_number_swaps_the_order_letter(db):
    when = date(2026, 3, 28)
    order_no = order_date_sequence_number(db, when)
    db.commit()
    invoice_no = next_invoice_number(db, order_no)
    db.commit()
    assert order_no.startswith("P")
    assert invoice_no == f"R{order_no[1:]}"


def test_order_counter_survives_past_ninety_nine(db):
    when = date(2026, 3, 27)
    numbers = {order_date_sequence_number(db, when) for _ in range(120)}
    db.commit()
    assert len(numbers) == 120


def test_customer_numbers_are_unique_and_prefixed(db):
    numbers = [next_customer_number(db, "TESTK") for _ in range(5)]
    db.commit()
    assert len(set(numbers)) == 5
    assert all(n.startswith("TESTK") for n in numbers)


def test_invoice_number_gets_a_revision_after_the_first(db):
    order_number = "01010199"
    db.execute(text('DELETE FROM counters WHERE scope = :s AND "key" = :k'), {"s": "invoice", "k": order_number})
    db.commit()
    first = next_invoice_number(db, order_number)
    second = next_invoice_number(db, order_number)
    db.commit()
    assert first == f"R{order_number}"
    assert second == f"R{order_number}-1"
    db.execute(text('DELETE FROM counters WHERE scope = :s AND "key" = :k'), {"s": "invoice", "k": order_number})
    db.commit()
