# scripts/seed_admin.py
import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "apps" / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

from config.database import SessionLocal  # noqa: E402
from app.Models.admin import AdminUser  # noqa: E402
from app.Utils.Helpers import hash_password  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed or update the initial admin user.")
    parser.add_argument("--email", default=os.getenv("SEED_ADMIN_EMAIL"), required=False)
    parser.add_argument("--password", default=os.getenv("SEED_ADMIN_PASSWORD"), required=False)
    parser.add_argument("--name", default=os.getenv("SEED_ADMIN_NAME", "Naeem Ahmad"))
    parser.add_argument("--force-password-reset", action="store_true")
    args = parser.parse_args()
    if not args.email or not args.password:
        print("ERROR: Provide --email and --password (or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)", file=sys.stderr)
        return 1
    if len(args.password) < 12:
        print("ERROR: Password must be at least 12 characters", file=sys.stderr)
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
        user = AdminUser(email=args.email, password_hash=hash_password(args.password), full_name=args.name, active=True)
        db.add(user)
        db.commit()
        print(f"Created admin user {args.email} (id={user.id})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
