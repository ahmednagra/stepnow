# apps/backend/alembic/versions/a1b2c3d4e5f6_0002_testimonial_author_photo_url.py
"""0002_testimonial_author_photo_url

Revision ID: a1b2c3d4e5f6
Revises: 05789571f56d
Create Date: 2026-05-11 18:30:00.000000

Adds nullable `author_photo_url` (varchar 500) to testimonials. Introduced
in Phase 6a (file uploads) so admins can attach a portrait to a testimonial.
URL only — no FK to uploads table because the testimonial doesn't own the
file (uploads are independent objects referenced by URL).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "05789571f56d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "testimonials",
        sa.Column("author_photo_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("testimonials", "author_photo_url")
