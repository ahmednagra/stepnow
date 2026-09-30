# apps/backend/app/Mixins/SeedManagedMixin.py
# Bookkeeping for rows a reference seeder owns but admins may edit (see scripts/seeders/_base.py
# "Managed seed"). Never exposed through the API and never written by the admin panel.
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class SeedManagedMixin:
    seed_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True,
        comment="SHA-256 of the values the seeder last wrote; live values that differ mean an admin edited the row, so re-seeding keeps it",
    )
