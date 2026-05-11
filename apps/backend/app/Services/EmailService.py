# apps/backend/app/Services/EmailService.py
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session
from app.Models.email_logs import EmailLog
from app.Utils.Logger import get_logger

logger = get_logger("email")


class EmailService:
    # Log-only provider for development. Real provider (Postmark/Resend) swaps in
    # by replacing _dispatch_via_provider with a real HTTP call.

    @staticmethod
    def queue(db: Session, to_address: str, template: str, subject: str, locale: str, extra: dict[str, Any] | None = None) -> EmailLog:
        # Queues an email row. Caller commits with the rest of the transaction.
        log = EmailLog(to_address=to_address, template=template, subject=subject, locale=locale, status="queued", extra=extra or {})
        db.add(log)
        db.flush()
        return log

    @staticmethod
    def dispatch_pending(db: Session, log_id: int) -> None:
        # Called from BackgroundTasks after response is sent. Opens its own commit boundary.
        log = db.query(EmailLog).filter(EmailLog.id == log_id, EmailLog.status == "queued").first()
        if not log:
            return
        log.attempts = (log.attempts or 0) + 1
        try:
            EmailService._dispatch_via_provider(log)
            log.status = "sent"
            log.provider = "log-only"
            log.provider_message_id = f"log-{log.id}"
            db.commit()
            logger.info(f"email sent: id={log.id} template={log.template} to={log.to_address}")
        except Exception as exc:
            log.status = "failed"
            log.error = str(exc)[:1000]
            db.commit()
            logger.exception(f"email send failed: id={log.id} to={log.to_address}")

    @staticmethod
    def _dispatch_via_provider(log: EmailLog) -> None:
        # Log-only provider: just write to the application log. No external call.
        logger.info(f"[EMAIL] template={log.template} to={log.to_address} subject={log.subject!r} locale={log.locale} extra={log.extra}")
