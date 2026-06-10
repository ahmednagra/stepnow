# apps/backend/app/Services/Notifications/Channels/EmailChannel.py
# Email channel: an adapter over the existing EmailService facade. It only QUEUES the email row
# (EmailService.queue) inside the current transaction; actual SMTP send happens later via
# BackgroundTasks → EmailService.dispatch_pending, exactly like every other email in the app.
# This keeps a single sending path and avoids importing SMTP machinery here.

from sqlalchemy.orm import Session

from app.Services.EmailService import EmailService
from app.Services.Notifications.Channels.BaseChannel import BaseChannel, NotificationPayload
from app.Utils.Logger import get_logger

logger = get_logger("notifications")


class EmailChannel(BaseChannel):
    name = "email"

    def deliver(self, db: Session, payload: NotificationPayload) -> None:
        to_address = (payload.data or {}).get("recipient_email")
        if not to_address:
            logger.debug(f"[EmailChannel] no recipient_email for type={payload.type_code}; skipped")
            return
        try:
            EmailService.queue(
                db,
                to_address=to_address,
                template="admin_notification",
                subject=payload.title,
                locale="de",
                extra={"body": payload.body, "link": payload.link, **(payload.data or {})},
                module="booking",
            )
        except Exception as exc:  # noqa: BLE001 — queueing must not break the notification fan-out
            logger.warning(f"[EmailChannel] queue failed type={payload.type_code}: {exc}")
