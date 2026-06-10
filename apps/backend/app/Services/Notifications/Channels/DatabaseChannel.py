# apps/backend/app/Services/Notifications/Channels/DatabaseChannel.py
# Durable inbox channel: writes one notifications row (flushed, not committed — the facade's
# caller owns the commit) and registers a post-commit WebSocket push to the recipient's
# "user:{id}" channel. The push is best-effort and fired via asyncio bridge; a socket failure
# is logged by the manager and never raised.

import asyncio

from sqlalchemy.orm import Session

from app.Models.notification import Notification
from app.Services.Notifications.Channels.BaseChannel import BaseChannel, NotificationPayload
from app.Utils.Logger import get_logger
from app.WebSocket.publisher import emit_to_user

logger = get_logger("notifications")


class DatabaseChannel(BaseChannel):
    name = "database"

    def deliver(self, db: Session, payload: NotificationPayload) -> None:
        row = Notification(
            recipient_id=payload.recipient_id,
            type=payload.type_code,
            category=payload.category,
            title=payload.title,
            body=payload.body,
            link=payload.link,
            notification_data=payload.data or {},
        )
        db.add(row)
        db.flush()  # assign id; caller commits with the surrounding transaction
        self._push(str(payload.recipient_id), row)

    @staticmethod
    def _push(recipient_id: str, row: Notification) -> None:
        # Best-effort realtime nudge so the panel's unread badge updates live.
        data = {
            "id": str(row.id),
            "type": row.type,
            "category": row.category,
            "title": row.title,
            "link": row.link,
        }
        try:
            asyncio.run(emit_to_user(recipient_id, "notification.created", data))
        except Exception as exc:  # noqa: BLE001 — realtime is best-effort
            logger.warning(f"[DatabaseChannel.push] recipient={recipient_id} failed: {exc}")
