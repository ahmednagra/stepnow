# scripts/seeders/_base.py
"""Shared helpers for seed scripts.

Every seeder imports from here. The bootstrap_path() call MUST run before any
other imports from app.* — otherwise Python can't find the backend package.

We add TWO directories to sys.path:
  1. apps/backend/    — so `from app.Models...` works
  2. monorepo root    — so `from scripts.seeders._base...` works between seeders

We do NOT chdir() — that would break the relative imports between sibling
seeder modules. Anything in apps/backend that assumes the cwd is itself must
be told explicitly via env vars (alembic.ini, etc.).
"""
import os
import sys
from pathlib import Path


def bootstrap_path() -> None:
    """Add monorepo root and apps/backend to sys.path so all imports work.
    Also loads the backend .env file so config.settings.Settings() validates
    even when run from the monorepo root (rather than apps/backend/).

    Idempotent — safe to call multiple times across seeders.
    """
    monorepo_root = Path(__file__).resolve().parent.parent.parent
    backend_dir = monorepo_root / "apps" / "backend"
    for p in (str(backend_dir), str(monorepo_root)):
        if p not in sys.path:
            sys.path.insert(0, p)
    # Load .env from apps/backend so Pydantic Settings can find required vars
    # like DATABASE_URL, JWT_SECRET_KEY, EMAIL_API_KEY. Without this, Settings()
    # raises ValidationError when called from a non-backend cwd.
    env_path = backend_dir / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv  # Pydantic Settings already depends on this
            load_dotenv(env_path, override=False)
        except ImportError:
            # Manually parse if python-dotenv isn't installed (unlikely)
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


# Run bootstrap immediately on import so child modules can rely on app.* imports
bootstrap_path()


SYSTEM_ACTOR_EMAIL = "system@stepnow.local"
SYSTEM_ACTOR_NAME = "Seed Script"


def get_system_actor(db):
    """Return the system admin user used as actor for seed-generated audit entries.

    Creates one on first call. Uses a non-functional password — this account
    cannot log in, only serves as a stable foreign key target for audit_log.
    """
    from app.Models.admin import AdminUser
    from app.Utils.Helpers import hash_password
    actor = db.query(AdminUser).filter(AdminUser.email == SYSTEM_ACTOR_EMAIL).first()
    if actor:
        return actor
    actor = AdminUser(
        email=SYSTEM_ACTOR_EMAIL,
        password_hash=hash_password("seed-only-not-for-login-" + os.urandom(16).hex()),
        full_name=SYSTEM_ACTOR_NAME,
        active=False,
    )
    db.add(actor)
    db.commit()
    db.refresh(actor)
    return actor


def log_action(label: str, action: str, detail: str = "") -> None:
    suffix = f" — {detail}" if detail else ""
    print(f"  [{action}] {label}{suffix}")


def log_skip(label: str, detail: str = "") -> None:
    log_action(label, "skip", detail or "already seeded")


def log_create(label: str, detail: str = "") -> None:
    log_action(label, "create", detail)


def log_update(label: str, detail: str = "") -> None:
    log_action(label, "update", detail)


def log_section(name: str) -> None:
    print(f"\n=== {name} ===")
