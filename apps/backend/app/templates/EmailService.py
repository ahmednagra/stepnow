# apps/backend/app/Services/EmailService.py
# Email facade: queue() writes an email_logs row; dispatch_pending() (run from
# BackgroundTasks) sends it. The sending mailbox is chosen per-module via the
# .env routing map (settings.module_mailbox). When SMTP is not enabled/configured
# the service falls back to log-only so flows never break.
#
# Bodies are rendered with Jinja templates (app/Templates/email) when a matching
# template exists; otherwise a minimal text body is used. A PDF is attached when
# the queued context carries an attachment reference (see _resolve_attachment).

import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from config.settings import settings
from app.Models.email_logs import EmailLog
from app.Services import EmailTemplates
from app.Utils.Logger import get_logger

logger = get_logger("email")

# Stored inside email_logs.extra so dispatch can pick the right mailbox later.
_MODULE_KEY = "_module"
_DEFAULT_MODULE = "booking"

# Reserved keys in extra that control sending but are NOT template variables.
_ATTACHMENT_PATH_KEY = "_attachment_path"   # absolute/relative path to a PDF on disk
_ATTACHMENT_NAME_KEY = "_attachment_name"   # filename shown to the recipient


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
        attachment_path: str | None = None,
        attachment_name: str | None = None,
    ) -> EmailLog:
        # Queues an email row. The module decides which mailbox sends it (resolved
        # at dispatch time). Caller commits with the rest of the transaction.
        # Pass attachment_path to attach a PDF (e.g. the generated invoice/slip).
        payload = dict(extra or {})
        payload[_MODULE_KEY] = (module or _DEFAULT_MODULE).strip().lower()
        if attachment_path:
            payload[_ATTACHMENT_PATH_KEY] = attachment_path
            if attachment_name:
                payload[_ATTACHMENT_NAME_KEY] = attachment_name
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

    # ── Body rendering ──────────────────────────────────────────────
    @staticmethod
    def _template_context(log: EmailLog) -> dict[str, Any]:
        """Template variables = queued extra minus the reserved control keys."""
        ctx = dict(log.extra or {})
        for k in (_MODULE_KEY, _ATTACHMENT_PATH_KEY, _ATTACHMENT_NAME_KEY):
            ctx.pop(k, None)
        # Make the subject available to templates too (used by some headers).
        ctx.setdefault("subject", log.subject)
        return ctx

    @staticmethod
    def _render_bodies(log: EmailLog) -> tuple[str | None, str]:
        """Return (html_or_None, text). Uses Jinja templates when available,
        otherwise falls back to the legacy plain-text builder."""
        ctx = EmailService._template_context(log)
        if EmailTemplates.template_exists(log.template):
            try:
                html, text = EmailTemplates.render(log.template, ctx)
                return html, text
            except Exception as exc:  # noqa: BLE001 — never let a template bug block the send
                logger.warning(f"template render failed (id={log.id}, tmpl={log.template}): {exc}")
        return None, EmailService._render_text(log)

    @staticmethod
    def _render_text(log: EmailLog) -> str:
        # Minimal, safe plain-text body. Fallback when no template renders.
        extra = EmailService._template_context(log)
        extra.pop("subject", None)
        lines = [log.subject, ""]
        if extra:
            for key, value in extra.items():
                lines.append(f"{key}: {value}")
            lines.append("")
        lines.append("— StepNow Rides & Movers")
        return "\n".join(lines)

    # ── Attachments ─────────────────────────────────────────────────
    @staticmethod
    def _resolve_attachment(log: EmailLog) -> tuple[bytes, str] | None:
        """If the queued context references a PDF on disk, load it.
        Returns (bytes, filename) or None. Missing files are logged, not fatal."""
        extra = log.extra or {}
        path = extra.get(_ATTACHMENT_PATH_KEY)
        if not path:
            return None
        p = Path(path)
        if not p.is_absolute():
            # Resolve relative paths against the configured upload dir.
            p = Path(settings.UPLOAD_DIR) / path
        if not p.exists() or not p.is_file():
            logger.warning(f"attachment not found for email id={log.id}: {p}")
            return None
        name = extra.get(_ATTACHMENT_NAME_KEY) or p.name
        return p.read_bytes(), name

    # ── SMTP send ───────────────────────────────────────────────────
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

        # Body: render HTML + text from templates (text-only when no HTML template).
        html, text = EmailService._render_bodies(log)
        msg.set_content(text)
        if html:
            msg.add_alternative(html, subtype="html")

        # Attachment: attach the generated PDF when one is referenced.
        attachment = EmailService._resolve_attachment(log)
        if attachment:
            data, filename = attachment
            msg.add_attachment(
                data, maintype="application", subtype="pdf", filename=filename
            )

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
