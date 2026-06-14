# apps/backend/scripts/seed.py
# Master seeder runner — runs all seeders in declared order.
# Each seeder's run() is idempotent: safe to re-run on an already-seeded DB.
# Called by:
#   python -m scripts.seed            (manual run)
#   AUTO_SEED_ON_STARTUP=true         (app lifespan, non-production only)

from scripts.seeders import (
    seed_system_user,
    seed_admin,
    seed_site_settings,
    seed_ui_strings,
    seed_services,
    seed_pricing,
    seed_vehicles,
    seed_faqs,
    seed_testimonials,
    seed_legal_pages,
    seed_bookings,
    seed_contact_messages,
    seed_expenses,
    seed_customers,
    seed_legacy_orders,
    seed_drivers,
    seed_parcel_orders,
)

# Seeders run in this exact order.  Dependents must appear AFTER their dependencies.
# ─────────────────────────────────────────────────────────────────────────────
# Core system
#   system_user → admin → site_settings → ui_strings
# Rides module
#   services → pricing → vehicles → faqs → testimonials → legal_pages
#   → bookings → contact_messages
# Accounting / legacy import (movers)
#   expenses → customers → legacy_orders
# Movers module demo data
#   drivers → parcel_orders
# ─────────────────────────────────────────────────────────────────────────────
SEEDERS_IN_ORDER = [
    seed_system_user,
    seed_admin,
    seed_site_settings,
    seed_ui_strings,
    seed_services,
    seed_pricing,
    seed_vehicles,
    seed_faqs,
    seed_testimonials,
    seed_legal_pages,
    seed_bookings,
    seed_contact_messages,
    seed_expenses,
    seed_customers,
    seed_legacy_orders,   # depends on customers
    seed_drivers,
    seed_parcel_orders,   # depends on customers + drivers
]


def run_all() -> list[str]:
    """Run every seeder in order. Returns a list of seeder names that raised."""
    failures: list[str] = []
    for seeder in SEEDERS_IN_ORDER:
        name = seeder.__name__.split(".")[-1]
        try:
            seeder.run()
        except Exception as exc:  # noqa: BLE001
            import traceback
            print(f"  [error] {name} failed: {exc}")
            traceback.print_exc()
            failures.append(name)
    return failures


if __name__ == "__main__":
    import sys
    failed = run_all()
    if failed:
        print(f"\n[seed] {len(failed)} seeder(s) failed: {', '.join(failed)}")
        sys.exit(1)
    print("\n[seed] all seeders completed successfully")
