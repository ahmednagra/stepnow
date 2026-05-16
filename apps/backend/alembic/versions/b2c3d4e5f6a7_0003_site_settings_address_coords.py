"""0003_site_settings_address_coords

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-16 14:00:00.000000

Adds nullable address_lat / address_lng (Numeric(9, 6)) to site_settings.
These columns exist on the SQLAlchemy SiteSettings model but were missing
from the initial schema migration, causing seeders to fail with
'column site_settings.address_lat does not exist'.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "site_settings",
        sa.Column("address_lat", sa.Numeric(precision=9, scale=6), nullable=True),
    )
    op.add_column(
        "site_settings",
        sa.Column("address_lng", sa.Numeric(precision=9, scale=6), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("site_settings", "address_lng")
    op.drop_column("site_settings", "address_lat")
