# apps/backend/app/Services/EmailService.py
# Email facade: queue() writes an email_logs row; dispatch_pending() (run from
# BackgroundTasks) sends it. The sending mailbox is chosen per-module via the
# .env routing map (settings.module_mailbox). When SMTP is not enabled/configured
# the service falls back to log-only so flows never break.

import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from typing import Any

from sqlalchemy.orm import Session

from config.settings import settings
from app.Models.email_logs import EmailLog
from app.Utils.Logger import get_logger

logger = get_logger("email")

# Stored inside email_logs.extra so dispatch can pick the right mailbox later.
_MODULE_KEY = "_module"
_DEFAULT_MODULE = "booking"


class EmailService:
    """Transactional email facade.

    Queue rows during the request's DB transaction (caller commits), then
    dispatch them after the response via BackgroundTasks. The mailbox each
    message sends from is resolved from settings.module_mailbox(module),
    which reads the MAILBOX_* routing map in .env.
    """

    @staticmethod
    def queue(
        db: Session,
        to_address: str,
        template: str,
        subject: str,
        locale: str,
        extra: dict[str, Any] | None = None,
        module: str = _DEFAULT_MODULE,
    ) -> EmailLog:
        # Queues an email row. The module decides which mailbox sends it (resolved
        # at dispatch time). Caller commits with the rest of the transaction.
        payload = dict(extra or {})
        payload[_MODULE_KEY] = (module or _DEFAULT_MODULE).strip().lower()
        log = EmailLog(
            to_address=to_address,
            template=template,
            subject=subject,
            locale=locale,
            status="queued",
            extra=payload,
        )
        db.add(log)
        db.flush()
        return log

    @staticmethod
    def dispatch_pending(db: Session, log_id: int) -> None:
        # Called from BackgroundTasks after the response is sent. Owns its commit.
        log = db.query(EmailLog).filter(EmailLog.id == log_id, EmailLog.status == "queued").first()
        if not log:
            return
        log.attempts = (log.attempts or 0) + 1
        try:
            provider, message_id = EmailService._dispatch_via_provider(log)
            log.status = "sent"
            log.provider = provider
            log.provider_message_id = message_id
            db.commit()
            logger.info(
                f"email sent: id={log.id} template={log.template} "
                f"to={log.to_address} via={provider}"
            )
        except Exception as exc:
            log.status = "failed"
            log.error = str(exc)[:1000]
            db.commit()
            logger.exception(f"email send failed: id={log.id} to={log.to_address}")

    @staticmethod
    def _module_of(log: EmailLog) -> str:
        extra = log.extra or {}
        return str(extra.get(_MODULE_KEY) or _DEFAULT_MODULE)

    @staticmethod
    def _dispatch_via_provider(log: EmailLog) -> tuple[str, str]:
        # Resolve the mailbox for this message's module, then send.
        # Returns (provider_label, provider_message_id).
        module = EmailService._module_of(log)
        mailbox = settings.module_mailbox(module)

        # Fall back to log-only when SMTP isn't enabled or the mailbox is incomplete.
        if not settings.email_enabled or not mailbox.is_configured:
            logger.info(
                f"[EMAIL log-only] module={module} template={log.template} "
                f"to={log.to_address} subject={log.subject!r} locale={log.locale} "
                f"from={mailbox.from_email} extra={log.extra}"
            )
            return "log-only", f"log-{log.id}"

        return EmailService._send_smtp(log, mailbox)

    @staticmethod
    def _send_smtp(log: EmailLog, mailbox: Any) -> tuple[str, str]:
        msg = EmailMessage()
        msg["From"] = formataddr((mailbox.from_name, mailbox.from_email))
        msg["To"] = log.to_address
        msg["Subject"] = log.subject
        if mailbox.reply_to:
            msg["Reply-To"] = mailbox.reply_to
        domain = mailbox.from_email.split("@")[-1] if "@" in mailbox.from_email else None
        message_id = make_msgid(domain=domain)
        msg["Message-ID"] = message_id

        # Body: plain text built from the queued context. Templates are not rendered
        # here yet — the extra dict carries the key fields; a renderer can replace this.
        msg.set_content(EmailService._render_text(log))

        if mailbox.use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(
                mailbox.host, mailbox.port, timeout=mailbox.timeout, context=context
            ) as server:
                server.login(mailbox.user, mailbox.password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(mailbox.host, mailbox.port, timeout=mailbox.timeout) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                server.login(mailbox.user, mailbox.password)
                server.send_message(msg)

        return "smtp", message_id

    @staticmethod
    def _render_text(log: EmailLog) -> str:
        # Minimal, safe plain-text body. Replace with a real template renderer later.
        extra = dict(log.extra or {})
        extra.pop(_MODULE_KEY, None)
        lines = [log.subject, ""]
        if extra:
            for key, value in extra.items():
                lines.append(f"{key}: {value}")
            lines.append("")
        lines.append("— StepNow Rides & Movers")
        return "\n".join(lines)
