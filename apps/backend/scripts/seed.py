# apps/backend/scripts/seed.py
# Master seeder runner. Two groups, each run in declared (dependency) order; every run() is
# idempotent, so re-running on a seeded DB is safe.
#
#   REFERENCE — the data the live site needs: system actor, admin, site settings, UI strings,
#     services, pricing, fleet, FAQs, legal pages, and the verbatim legacy import from
#     StepNow_Data.json (customers, expenses, orders). Safe in every environment; UI strings,
#     services and FAQs follow the managed-seed rule and never overwrite admin edits.
#   DEMO — fabricated records that only make the admin lists look populated (sample bookings,
#     contact messages, drivers, their car assignments, parcel orders). Never on production:
#     they run only with --demo AND ENVIRONMENT explicitly set to a non-production value.
#
#   python -m scripts.seed            reference seeders
#   python -m scripts.seed --demo     reference + demo seeders (non-production only)
#   AUTO_SEED_ON_STARTUP=true         app lifespan runs run_all() = reference only (non-production)

import os
import sys
import traceback

from scripts.seeders import (
    seed_system_user,
    seed_admin,
    seed_site_settings,
    seed_ui_strings,
    seed_services,
    seed_pricing,
    seed_vehicles,
    seed_fleet_vehicles,
    seed_faqs,
    seed_legal_pages,
    seed_bookings,
    seed_contact_messages,
    seed_expenses,
    seed_customers,
    seed_legacy_orders,
    seed_drivers,
    seed_driver_vehicle_assignments,
    seed_parcel_orders,
)

# Core system → content → fleet → legacy import. legacy_orders needs customers + fleet_vehicles.
REFERENCE_SEEDERS = [
    seed_system_user,
    seed_admin,
    seed_site_settings,
    seed_ui_strings,
    seed_services,
    seed_pricing,
    seed_vehicles,
    seed_fleet_vehicles,
    seed_faqs,
    seed_legal_pages,
    seed_expenses,
    seed_customers,
    seed_legacy_orders,
]

# Run after REFERENCE_SEEDERS. driver_vehicle_assignments needs drivers + fleet_vehicles;
# parcel_orders needs customers + drivers.
DEMO_SEEDERS = [
    seed_bookings,
    seed_contact_messages,
    seed_drivers,
    seed_driver_vehicle_assignments,
    seed_parcel_orders,
]

PRODUCTION_ENVIRONMENTS = {"production", "prod"}


def demo_refusal() -> str | None:
    # Fail closed: an unset ENVIRONMENT (settings then default to "development") is treated as
    # possibly-production, so demo data can never reach a server that forgot to set it.
    env = os.environ.get("ENVIRONMENT", "").strip().lower()
    if not env:
        return "ENVIRONMENT is not set — set it explicitly (e.g. ENVIRONMENT=dev) to load demo data"
    if env in PRODUCTION_ENVIRONMENTS:
        return f"ENVIRONMENT={env} — demo seeders write fabricated bookings, drivers and orders and never run on production"
    return None


def run_all(include_demo: bool = False) -> list[str]:
    """Run the reference seeders (plus the demo seeders when asked). Returns the names that raised."""
    if include_demo and (reason := demo_refusal()):
        raise RuntimeError(f"Demo seeders refused: {reason}")
    failures: list[str] = []
    for seeder in REFERENCE_SEEDERS + (DEMO_SEEDERS if include_demo else []):
        name = seeder.__name__.split(".")[-1]
        try:
            seeder.run()
        except Exception as exc:  # noqa: BLE001
            print(f"  [error] {name} failed: {exc}")
            traceback.print_exc()
            failures.append(name)
    return failures


if __name__ == "__main__":
    unknown = [arg for arg in sys.argv[1:] if arg != "--demo"]
    if unknown:
        sys.exit(f"usage: python -m scripts.seed [--demo]   (unknown: {' '.join(unknown)})")
    try:
        failed = run_all(include_demo="--demo" in sys.argv[1:])
    except RuntimeError as exc:
        sys.exit(f"[seed] {exc}")
    if failed:
        print(f"\n[seed] {len(failed)} seeder(s) failed: {', '.join(failed)}")
        sys.exit(1)
    print("\n[seed] all seeders completed successfully")
