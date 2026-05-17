# apps/backend/scripts/seeders/_base.py
# Shared seeder bootstrap: adds apps/backend to sys.path, loads .env, exposes get_system_actor() and log helpers.

import os
import sys
from pathlib import Path


def bootstrap_path() -> None:
    # _base.py → seeders → scripts → apps/backend. Adds apps/backend to sys.path and loads its .env. Idempotent.
    backend_dir = Path(__file__).resolve().parent.parent.parent
    backend_path = str(backend_dir)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    env_path = backend_dir / ".env"
    if not env_path.exists():
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path, override=False)
    except ImportError:
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


bootstrap_path()

SYSTEM_ACTOR_EMAIL = "system@stepnow.local"
SYSTEM_ACTOR_NAME = "Seed Script"


def get_system_actor(db):
    # Returns the inactive system AdminUser used as audit_log actor for seed inserts. Created on first call; non-functional password.
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
    print(f"  [{action}] {label}" + (f" — {detail}" if detail else ""))


def log_skip(label: str, detail: str = "") -> None:
    log_action(label, "skip", detail or "already seeded")


def log_create(label: str, detail: str = "") -> None:
    log_action(label, "create", detail)


def log_update(label: str, detail: str = "") -> None:
    log_action(label, "update", detail)


def log_section(name: str) -> None:
    print(f"\n=== {name} ===")
