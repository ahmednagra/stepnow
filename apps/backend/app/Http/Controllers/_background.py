# apps/backend/app/Http/Controllers/_background.py
# Post-commit side-effects shared across controllers. Each opens its own DB session and runs on
# BackgroundTasks after the response is sent (best-effort); a failure never affects the response.

from uuid import UUID
from config.database import SessionLocal
from app.Services.Notifications import NotificationService
from app.Services.EmailService import EmailService


def notify_admins(type_code: str, title: str, body: str | None, link: str, data: dict, actor_id: UUID | None) -> None:
    # In-app notification to every active admin (excludes the actor who triggered it). Owns its commit.
    db = SessionLocal()
    try:
        NotificationService.notify_all_admins(
            db, type_code, title, body=body, link=link, data=data, exclude_id=actor_id
        )
        db.commit()
    finally:
        db.close()


def dispatch_emails(email_log_ids: list[int]) -> None:
    # Loops the queued email logs, dispatching each. Opens its own DB session per architecture §6.
    if not email_log_ids:
        return
    db = SessionLocal()
    try:
        for log_id in email_log_ids:
            EmailService.dispatch_pending(db, log_id)
    finally:
        db.close()
