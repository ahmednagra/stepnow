# scripts/seed_admin.py
import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "apps" / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

# Load .env so SEED_ADMIN_* env vars resolve without exporting them by hand.
try:
    from dotenv import load_dotenv
    load_dotenv(BACKEND_DIR / ".env", override=False)
except ImportError:
    pass

from config.database import SessionLocal  # noqa: E402
from app.Models.admin import AdminUser  # noqa: E402
from app.Utils.Helpers import hash_password  # noqa: E402


MIN_PASSWORD_LENGTH = 12


def _is_truthy(v: str | None) -> bool:
    return (v or "").strip().lower() in {"1", "true", "yes", "on"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed or update the initial admin user.")
    parser.add_argument("--email", default=os.getenv("SEED_ADMIN_EMAIL"), required=False)
    parser.add_argument("--password", default=os.getenv("SEED_ADMIN_PASSWORD"), required=False)
    parser.add_argument("--name", default=os.getenv("SEED_ADMIN_NAME", "Naeem Ahmad"))
    parser.add_argument("--force-password-reset", action="store_true")
    parser.add_argument(
        "--allow-weak-password",
        action="store_true",
        default=_is_truthy(os.getenv("SEED_ADMIN_ALLOW_WEAK_PASSWORD")),
        help=(
            "Bypass the 12-character minimum password check. "
            "Reserved for local development only — NEVER use in production. "
            "Can also be set via SEED_ADMIN_ALLOW_WEAK_PASSWORD=true."
        ),
    )
    args = parser.parse_args()

    if not args.email or not args.password:
        print(
            "ERROR: Provide --email and --password "
            "(or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env)",
            file=sys.stderr,
        )
        return 1

    if len(args.password) < MIN_PASSWORD_LENGTH:
        if not args.allow_weak_password:
            print(
                f"ERROR: Password must be at least {MIN_PASSWORD_LENGTH} characters.\n"
                "       Either choose a longer password (recommended), or — for local\n"
                "       development only — set SEED_ADMIN_ALLOW_WEAK_PASSWORD=true in .env\n"
                "       or pass --allow-weak-password on the command line.",
                file=sys.stderr,
            )
            return 1
        # Loud warning. Show on every weak-password run so it can never get used
        # silently in production by mistake.
        env_name = os.getenv("ENVIRONMENT", "unknown")
        print("", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print("  WARNING: Weak password override is ACTIVE", file=sys.stderr)
        print(f"    - Password length: {len(args.password)} chars "
              f"(minimum without override: {MIN_PASSWORD_LENGTH})", file=sys.stderr)
        print(f"    - Email:           {args.email}", file=sys.stderr)
        print(f"    - ENVIRONMENT:     {env_name}", file=sys.stderr)
        print("  This is FOR LOCAL DEVELOPMENT ONLY. If you see this on a", file=sys.stderr)
        print("  production server, STOP and rotate the password immediately.", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print("", file=sys.stderr)
        # Hard refuse in production no matter what flag is set.
        if env_name == "production":
            print(
                "ERROR: SEED_ADMIN_ALLOW_WEAK_PASSWORD refused because ENVIRONMENT=production.\n"
                "       Use a real password (>= 12 chars). No exceptions in production.",
                file=sys.stderr,
            )
            return 1

    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == args.email).first()
        if existing:
            if args.force_password_reset:
                existing.password_hash = hash_password(args.password)
                existing.full_name = args.name
                existing.active = True
                db.commit()
                print(f"Updated admin user {args.email} (password reset)")
                return 0
            print(f"Admin {args.email} already exists. Use --force-password-reset to update.")
            return 0
        user = AdminUser(
            email=args.email,
            password_hash=hash_password(args.password),
            full_name=args.name,
            active=True,
        )
        db.add(user)
        db.commit()
        print(f"Created admin user {args.email} (id={user.id})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())