# scripts/seeders/seed_system_user.py
"""Create the system admin user used as actor for seed-generated audit entries.

This account:
- Email: system@stepnow.local
- Cannot log in (active=False, non-functional password)
- Serves only as a stable FK target for audit_log entries from seed scripts
- Distinguishable from Naeem's real admin activity in audit log filters

Idempotent: re-running is a no-op if the account already exists.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip, SYSTEM_ACTOR_EMAIL  # noqa: E402


def run() -> None:
    log_section("System actor (system@stepnow.local)")
    db = SessionLocal()
    try:
        from app.Models.admin import AdminUser
        existing = db.query(AdminUser).filter(AdminUser.email == SYSTEM_ACTOR_EMAIL).first()
        if existing:
            log_skip(SYSTEM_ACTOR_EMAIL, f"id={existing.id}")
            return
        actor = get_system_actor(db)
        log_create(SYSTEM_ACTOR_EMAIL, f"id={actor.id}, active=False (cannot log in)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
