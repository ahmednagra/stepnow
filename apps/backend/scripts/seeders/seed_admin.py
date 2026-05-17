# apps/backend/scripts/seeders/seed_admin.py
# Seeds the initial admin user. run() = auto-run from seed.py (env-driven, skips if creds missing); main() = standalone CLI for rotations.

import argparse
import os
import sys
from scripts.seeders._base import log_section, log_create, log_skip, log_update
from config.database import SessionLocal
from app.Models.admin import AdminUser
from app.Utils.Helpers import hash_password

MIN_PASSWORD_LENGTH = 12


def _is_truthy(v: str | None) -> bool:
    return (v or "").strip().lower() in {"1", "true", "yes", "on"}


def _validate_password(password: str, email: str, *, allow_weak: bool, stream=sys.stderr) -> bool:
    # >=12 chars always OK. Weak allowed only with explicit override AND non-production. Production rejects override unconditionally.
    if len(password) >= MIN_PASSWORD_LENGTH:
        return True
    if not allow_weak:
        print(
            f"ERROR: Password must be at least {MIN_PASSWORD_LENGTH} characters.\n"
            "       Set SEED_ADMIN_ALLOW_WEAK_PASSWORD=true in .env or pass --allow-weak-password for LOCAL DEV ONLY.",
            file=stream,
        )
        return False
    env_name = os.getenv("ENVIRONMENT", "unknown")
    if env_name == "production":
        print("ERROR: SEED_ADMIN_ALLOW_WEAK_PASSWORD refused because ENVIRONMENT=production. No exceptions.", file=stream)
        return False
    print("\n" + "=" * 70, file=stream)
    print("  WARNING: Weak password override is ACTIVE — LOCAL DEV ONLY", file=stream)
    print(f"    length={len(password)} chars (min without override: {MIN_PASSWORD_LENGTH})", file=stream)
    print(f"    email={email}    ENVIRONMENT={env_name}", file=stream)
    print("=" * 70 + "\n", file=stream)
    return True


def _seed_admin(email: str, password: str, full_name: str, *, force_reset: bool, allow_weak: bool) -> int:
    # Create-or-skip-or-rotate. Returns 0 on success, 1 on validation failure. Idempotent unless force_reset is set.
    if not _validate_password(password, email, allow_weak=allow_weak):
        return 1
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == email).first()
        if existing:
            if force_reset:
                existing.password_hash = hash_password(password)
                existing.full_name = full_name
                existing.active = True
                db.commit()
                log_update(email, "password reset, re-activated")
                return 0
            log_skip(email, f"id={existing.id} — pass --force-password-reset to rotate")
            return 0
        user = AdminUser(email=email, password_hash=hash_password(password), full_name=full_name, active=True)
        db.add(user)
        db.commit()
        log_create(email, f"id={user.id}, active=True")
        return 0
    finally:
        db.close()


def run() -> None:
    # Auto-run entry for seed.py. Reads SEED_ADMIN_EMAIL/PASSWORD/NAME from env; skips cleanly if creds not configured. Never force-resets in this mode.
    log_section("Initial admin user")
    email = os.getenv("SEED_ADMIN_EMAIL")
    password = os.getenv("SEED_ADMIN_PASSWORD")
    full_name = os.getenv("SEED_ADMIN_NAME", "Naeem Ahmad")
    allow_weak = _is_truthy(os.getenv("SEED_ADMIN_ALLOW_WEAK_PASSWORD"))
    if not email or not password:
        log_skip("admin user", "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — run `python -m scripts.seeders.seed_admin --email=... --password=...` manually")
        return
    _seed_admin(email, password, full_name, force_reset=False, allow_weak=allow_weak)


def main() -> int:
    # Standalone CLI for one-off creation or password rotation. Use --force-password-reset to overwrite an existing admin's password.
    parser = argparse.ArgumentParser(description="Seed or update the initial admin user.")
    parser.add_argument("--email", default=os.getenv("SEED_ADMIN_EMAIL"))
    parser.add_argument("--password", default=os.getenv("SEED_ADMIN_PASSWORD"))
    parser.add_argument("--name", default=os.getenv("SEED_ADMIN_NAME", "Naeem Ahmad"))
    parser.add_argument("--force-password-reset", action="store_true")
    parser.add_argument(
        "--allow-weak-password",
        action="store_true",
        default=_is_truthy(os.getenv("SEED_ADMIN_ALLOW_WEAK_PASSWORD")),
        help="Bypass the 12-char minimum. LOCAL DEV ONLY. Refused when ENVIRONMENT=production.",
    )
    args = parser.parse_args()
    if not args.email or not args.password:
        print("ERROR: Provide --email and --password (or SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env)", file=sys.stderr)
        return 1
    log_section("Initial admin user (standalone)")
    return _seed_admin(args.email, args.password, args.name, force_reset=args.force_password_reset, allow_weak=args.allow_weak_password)


if __name__ == "__main__":
    sys.exit(main())
