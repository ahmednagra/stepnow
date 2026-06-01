# apps/backend/scripts/seed.py
# Seed runner: bootstraps sys.path + .env, runs all idempotent seeders in dependency order. CLI for manual use; run_all() reused by main.py lifespan.

import argparse
import importlib
import sys
import traceback
from pathlib import Path

# Add apps/backend/ to sys.path so `config.*`, `app.*`, and `scripts.*` all resolve. Required when invoked as `python scripts/seed.py` or via importlib.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

# Load apps/backend/.env so Pydantic Settings validates regardless of cwd (monorepo root, backend dir, in-process from lifespan).
_ENV_PATH = _BACKEND_DIR / ".env"
if _ENV_PATH.exists():
    try:
        from dotenv import load_dotenv

        load_dotenv(_ENV_PATH, override=False)
    except ImportError:
        import os as _os

        for _line in _ENV_PATH.read_text().splitlines():
            _line = _line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _k, _, _v = _line.partition("=")
            _k, _v = _k.strip(), _v.strip().strip('"').strip("'")
            if _k and _k not in _os.environ:
                _os.environ[_k] = _v

# Dependency order: system_user (audit actor) → admin (Naeem) → site_settings (legal placeholders) → content seeders → forms with FKs.
SEEDERS_IN_ORDER = [
    ("system_user", "scripts.seeders.seed_system_user"),
    ("admin", "scripts.seeders.seed_admin"),
    ("site_settings", "scripts.seeders.seed_site_settings"),
    ("ui_strings", "scripts.seeders.seed_ui_strings"),
    ("services", "scripts.seeders.seed_services"),
    ("pricing", "scripts.seeders.seed_pricing"),
    ("vehicles", "scripts.seeders.seed_vehicles"),
    ("faqs", "scripts.seeders.seed_faqs"),
    ("testimonials", "scripts.seeders.seed_testimonials"),
    ("legal_pages", "scripts.seeders.seed_legal_pages"),
    ("bookings", "scripts.seeders.seed_bookings"),
    ("contact_messages", "scripts.seeders.seed_contact_messages"),
    ("expenses", "scripts.seeders.seed_expenses"),
    ("customers", "scripts.seeders.seed_customers"),
    ("drivers", "scripts.seeders.seed_drivers"),
    ("parcel_orders", "scripts.seeders.seed_parcel_orders"),
]


def run_all(only: set[str] | None = None) -> list[str]:
    # Runs seeders in declared order. Returns list of failed seeder names ([] = full success). Per-seeder errors are isolated.
    available = {name for name, _ in SEEDERS_IN_ORDER}
    if only is not None:
        unknown = only - available
        if unknown:
            print(
                f"ERROR: unknown seeder(s): {', '.join(sorted(unknown))}\nAvailable: {', '.join(sorted(available))}",
                file=sys.stderr,
            )
            return ["__unknown_seeder_names__"]
        to_run = [(n, m) for n, m in SEEDERS_IN_ORDER if n in only]
    else:
        to_run = list(SEEDERS_IN_ORDER)
    print("=" * 60)
    print(f"  StepNow seed runner — {len(to_run)} seeder(s)")
    print("=" * 60)
    failures: list[str] = []
    for name, module_path in to_run:
        try:
            module = importlib.import_module(module_path)
            module.run()
        except Exception as e:
            print(f"\n  [ERROR] seeder '{name}' failed: {e}")
            traceback.print_exc()
            failures.append(name)
    print("\n" + "=" * 60)
    print(
        f"  FAILED: {len(failures)} seeder(s) — {', '.join(failures)}"
        if failures
        else f"  SUCCESS: all {len(to_run)} seeder(s) completed"
    )
    print("=" * 60)
    return failures


def main() -> int:
    # CLI entry. --list prints seeders in order; --only=a,b runs a subset. Returns non-zero exit code if any seeder failed.
    parser = argparse.ArgumentParser(description="Run all dev seeders for StepNow.")
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Comma-separated seeder names (e.g. 'ui_strings,services')",
    )
    parser.add_argument(
        "--list", action="store_true", help="List available seeders and exit"
    )
    args = parser.parse_args()
    if args.list:
        print("Available seeders (in run order):")
        for name, _ in SEEDERS_IN_ORDER:
            print(f"  - {name}")
        return 0
    only = {s.strip() for s in args.only.split(",")} if args.only else None
    return 1 if run_all(only=only) else 0


if __name__ == "__main__":
    sys.exit(main())
