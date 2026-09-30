# apps/backend/tests/test_schema_sync.py
# sync_schema's ADD COLUMN statement. Pure — no database: the regression is in the SQL text.
# A plain string server_default used to render unquoted (`DEFAULT draft`), which Postgres reads
# as a column identifier and the boot fails.

import pytest
from sqlalchemy import Boolean, Column, MetaData, Numeric, String, Table, text
from sqlalchemy.dialects import postgresql

from main import _add_column_sql

DIALECT = postgresql.dialect()


def _sql(column: Column) -> tuple[str, bool]:
    Table("orders", MetaData(), column)
    return _add_column_sql(DIALECT, "orders", column)


@pytest.mark.parametrize(
    ("column", "expected"),
    [
        (Column("delivery_status", String(20), server_default="draft"),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "delivery_status" VARCHAR(20) DEFAULT 'draft'"""),
        (Column("is_archived", Boolean, server_default=text("false")),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN DEFAULT false"""),
        (Column("currency", String(3), server_default=text("'EUR'")),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'EUR'"""),
        (Column("net_amount", Numeric(10, 2), server_default=text("0")),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "net_amount" NUMERIC(10, 2) DEFAULT 0"""),
        (Column("vat_rate", Numeric(6, 4), server_default="0.1900"),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vat_rate" NUMERIC(6, 4) DEFAULT '0.1900'"""),
        (Column("note", String(50), server_default="it's"),
         """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "note" VARCHAR(50) DEFAULT 'it''s'"""),
    ],
)
def test_server_default_is_rendered_as_valid_sql(column, expected):
    assert _sql(column) == (expected, True)


def test_column_without_default_has_no_default_clause():
    assert _sql(Column("client_reference", String(100))) == (
        """ALTER TABLE orders ADD COLUMN IF NOT EXISTS "client_reference" VARCHAR(100)""",
        False,
    )
