# apps/backend/scripts/seeders/seed_system_user.py
# Creates the system@stepnow.local admin used as the actor on every seed-generated audit entry. It
# cannot log in (active=False, non-functional password) and exists only as a stable FK target, which
# keeps seed activity distinguishable from Naeem's real admin activity in audit-log filters.
#
# Idempotent: a no-op once the account exists.

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
