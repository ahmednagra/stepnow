# apps/backend/app/Services/Notifications/Channels/DatabaseChannel.py
# Durable inbox channel: writes one notifications row (flushed, not committed — the facade's
# caller owns the commit) and registers a post-commit WebSocket push to the recipient's
# "user:{id}" channel. The push is best-effort and handed to the server loop; a socket failure
# is logged by the manager and never raised.

from sqlalchemy.orm import Session

from app.Models.notification import Notification
from app.Services.Notifications.Channels.BaseChannel import BaseChannel, NotificationPayload
from app.WebSocket.publisher import emit_soon, emit_to_user


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
        emit_soon(emit_to_user(recipient_id, "notification.created", data))
