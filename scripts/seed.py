# scripts/seed.py
"""Run all dev seeders in dependency order.

Usage:
    python scripts/seed.py              # run all seeders (idempotent — skips existing rows)
    python scripts/seed.py --only=ui_strings,services    # run specific seeders only

Each seeder is idempotent: re-running this script is safe. Rows that already
exist are skipped with a '[skip] already seeded' message.

Dependency order matters:
  1. system_user        — actor for audit log entries
  2. site_settings      — needed by legal_pages (placeholder resolution)
  3. ui_strings         — independent
  4. services           — needed by pricing, bookings
  5. pricing            — depends on services
  6. vehicles           — independent
  7. faqs               — independent
  8. testimonials       — independent
  9. legal_pages        — depends on site_settings (placeholders)
 10. bookings           — depends on services (FK reference)
 11. contact_messages   — independent

Existing admin users (Naeem) are NOT touched. To create the initial admin
user, run `python scripts/seed_admin.py --email=... --password=...` separately.
"""
import argparse
import sys
from pathlib import Path

# Two sys.path entries are required BEFORE importing any seeder:
#   1. monorepo root        — so the dotted path `scripts.seeders.seed_<name>` resolves
#   2. apps/backend         — so `from config.database import ...` and `from app.* import ...` work
# Python only auto-adds the script's directory (scripts/) to sys.path; neither
# the monorepo root nor apps/backend are there by default.
_MONOREPO_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_DIR = _MONOREPO_ROOT / "apps" / "backend"
for _p in (str(_BACKEND_DIR), str(_MONOREPO_ROOT)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Load apps/backend/.env so Pydantic Settings can read DATABASE_URL etc.
# Settings reads ".env" relative to cwd, which fails when running from
# monorepo root, so we manually populate os.environ here.
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
            _k = _k.strip()
            _v = _v.strip().strip('"').strip("'")
            if _k and _k not in _os.environ:
                _os.environ[_k] = _v

# Order matters — earlier seeders may produce data later ones depend on
SEEDERS_IN_ORDER = [
    ("system_user", "scripts.seeders.seed_system_user"),
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
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Run all dev seeders for StepNow.")
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Comma-separated list of seeder names to run (e.g. 'ui_strings,services'). Default: all.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available seeders and exit.",
    )
    args = parser.parse_args()

    available = {name for name, _ in SEEDERS_IN_ORDER}

    if args.list:
        print("Available seeders (in run order):")
        for name, _ in SEEDERS_IN_ORDER:
            print(f"  - {name}")
        return 0

    if args.only:
        selected = {s.strip() for s in args.only.split(",")}
        unknown = selected - available
        if unknown:
            print(f"ERROR: unknown seeder(s): {', '.join(sorted(unknown))}", file=sys.stderr)
            print(f"Available: {', '.join(sorted(available))}", file=sys.stderr)
            return 1
        to_run = [(name, module) for name, module in SEEDERS_IN_ORDER if name in selected]
    else:
        to_run = list(SEEDERS_IN_ORDER)

    print("=" * 60)
    print(f"  StepNow seed runner — {len(to_run)} seeder(s)")
    print("=" * 60)

    import importlib
    failures = []
    for name, module_path in to_run:
        try:
            module = importlib.import_module(module_path)
            module.run()
        except Exception as e:
            print(f"\n  [ERROR] seeder '{name}' failed: {e}")
            import traceback
            traceback.print_exc()
            failures.append(name)

    print("\n" + "=" * 60)
    if failures:
        print(f"  FAILED: {len(failures)} seeder(s) — {', '.join(failures)}")
        print("=" * 60)
        return 1
    print(f"  SUCCESS: all {len(to_run)} seeder(s) completed")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
