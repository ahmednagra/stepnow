# apps/backend/scripts/migrate_settings_trust_numbers.py
# One-off, idempotent schema patch adding homepage trust-number columns to site_settings.
#
# create_all(checkfirst=True) only creates missing TABLES, never alters an existing one,
# so new COLUMNS on site_settings need explicit ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
# Safe to run repeatedly.
#
#   cd apps/backend
#   python -m scripts.migrate_settings_trust_numbers

from scripts.seeders._base import bootstrap_path  # noqa: F401  (loads .env + sys.path)

from sqlalchemy import text
from config.database import engine

# site_settings: trust-signal columns (matches app/Models/settings.py)
SETTINGS_COLUMNS: dict[str, str] = {
    "years_active": "INTEGER",
    "rides_completed": "INTEGER",
    "fleet_size": "INTEGER",
    "google_rating": "NUMERIC(2, 1)",
    "google_review_count": "INTEGER",
}


def run() -> None:
    print("\n=== migrate: site_settings trust numbers ===")
    with engine.begin() as conn:
        for name, ddl in SETTINGS_COLUMNS.items():
            conn.execute(text(f"ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS {name} {ddl}"))
            print(f"  [ok] site_settings.{name} ({ddl})")
    print("=== done ===\n")


if __name__ == "__main__":
    run()
