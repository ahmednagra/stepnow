# apps/backend/scripts/migrate_settings_staff_access_code.py
# One-off, idempotent schema patch adding the shared worker PIN column to site_settings.
#
# create_all(checkfirst=True) only creates missing TABLES, never alters an existing one,
# so the new staff_access_code COLUMN needs an explicit ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
# Without it the /public/staff-gate + /public/orders gate raises UndefinedColumn (HTTP 500).
# Safe to run repeatedly.
#
#   cd apps/backend
#   python -m scripts.migrate_settings_staff_access_code

from scripts.seeders._base import bootstrap_path  # noqa: F401  (loads .env + sys.path)

from sqlalchemy import text
from config.database import engine

# site_settings: shared worker PIN gating no-login order creation (matches app/Models/settings.py)
SETTINGS_COLUMNS: dict[str, str] = {
    "staff_access_code": "VARCHAR(50)",
}


def run() -> None:
    print("\n=== migrate: site_settings staff_access_code ===")
    with engine.begin() as conn:
        for name, ddl in SETTINGS_COLUMNS.items():
            conn.execute(text(f"ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS {name} {ddl}"))
            print(f"  [ok] site_settings.{name} ({ddl})")
    print("=== done ===\n")


if __name__ == "__main__":
    run()
