# apps/backend/scripts/migrate_orders_vehicle_fields.py
# One-off, idempotent schema patch for the vehicle-centric order rework.
#
# The project has no Alembic yet — main.py uses Base.metadata.create_all(checkfirst=True),
# which only creates MISSING TABLES and never alters an existing one. So:
#   • New tables (driver_vehicle_assignments) are created automatically by create_all.
#   • New COLUMNS on existing tables (orders, vehicles) must be applied with explicit
#     ALTER TABLE ... ADD COLUMN IF NOT EXISTS statements (PostgreSQL).
#
# Safe to run repeatedly: every statement is guarded.
#
#   cd apps/backend
#   python -m scripts.migrate_orders_vehicle_fields

from scripts.seeders._base import bootstrap_path  # noqa: F401  (loads .env + sys.path)

from sqlalchemy import text
from config.database import engine

# orders: courier/transport columns (matches app/Models/orders.py)
ORDER_COLUMNS: dict[str, str] = {
    "vehicle_name": "VARCHAR(200)",
    "client_reference": "VARCHAR(100)",
    "service_type": "VARCHAR(50)",
    "preferred_date": "DATE",
    "total_km": "NUMERIC(8, 2)",
    "occupied_km": "NUMERIC(8, 2)",
    "vehicle_id": "UUID",
}

# vehicles: operational-fleet columns added to the shared registry (matches app/Models/vehicles.py)
VEHICLE_COLUMNS: dict[str, str] = {
    "public_visible": "BOOLEAN NOT NULL DEFAULT true",
    "plate": "VARCHAR(50)",
    "ownership_type": "VARCHAR(10)",
}


def run() -> None:
    print("\n=== migrate: vehicle-centric fields (orders + vehicles) ===")
    with engine.begin() as conn:
        for name, ddl in ORDER_COLUMNS.items():
            conn.execute(text(f"ALTER TABLE orders ADD COLUMN IF NOT EXISTS {name} {ddl}"))
            print(f"  [ok] orders.{name} ({ddl})")

        for name, ddl in VEHICLE_COLUMNS.items():
            conn.execute(text(f"ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS {name} {ddl}"))
            print(f"  [ok] vehicles.{name} ({ddl})")
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_vehicles_plate ON vehicles (plate)"))
        print("  [ok] vehicles.plate index")

        # ── Cleanup: remove artifacts from the abandoned separate-fleet table approach ──
        # (orders.fleet_vehicle_id FK/index/column, the fleet_vehicles table, and the old
        #  driver_vehicle_assignments.fleet_vehicle_id column). All guarded so this is a no-op
        #  on a clean schema.
        conn.execute(text("ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_fleet_vehicle"))
        conn.execute(text("DROP INDEX IF EXISTS ix_orders_fleet_vehicle_id"))
        conn.execute(text("ALTER TABLE orders DROP COLUMN IF EXISTS fleet_vehicle_id"))
        # Recreate the assignments table only if it still has the old fleet_vehicle_id column —
        # drop it so create_all rebuilds it with vehicle_id. (Dev-only; no real data yet.)
        has_old_dva = conn.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='driver_vehicle_assignments' AND column_name='fleet_vehicle_id'"
            )
        ).first()
        if has_old_dva:
            conn.execute(text("DROP TABLE IF EXISTS driver_vehicle_assignments CASCADE"))
            print("  [ok] dropped stale driver_vehicle_assignments (recreated by create_all)")
        conn.execute(text("DROP TABLE IF EXISTS fleet_vehicles CASCADE"))
        print("  [ok] cleaned up abandoned fleet_vehicles artifacts")
    print("=== done ===\n")


if __name__ == "__main__":
    run()
