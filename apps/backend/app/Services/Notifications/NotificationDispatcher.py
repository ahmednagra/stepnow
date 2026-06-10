# apps/backend/app/Services/Notifications/NotificationDispatcher.py
# Multi-channel fan-out. Given a resolved type + payload, look up the channels that type
# delivers to and run each channel's deliver(). A channel failure is isolated (logged, others
# still run). Channels are registered once here; adding push/SMS later is one dict entry.

from sqlalchemy.orm import Session

from app.Services.Notifications.Channels.BaseChannel import BaseChannel, NotificationPayload
from app.Services.Notifications.Channels.DatabaseChannel import DatabaseChannel
from app.Services.Notifications.Channels.EmailChannel import EmailChannel
from app.Services.Notifications.types import resolve_type
from app.Utils.Logger import get_logger

logger = get_logger("notifications")

# Single registry — instantiated once.
_CHANNELS: dict[str, BaseChannel] = {
    "database": DatabaseChannel(),
    "email": EmailChannel(),
}


class NotificationDispatcher:

    @staticmethod
    def dispatch(db: Session, payload: NotificationPayload, channels: tuple[str, ...] | None = None) -> None:
        type_def = resolve_type(payload.type_code)
        selected = channels if channels is not None else type_def.default_channels
        for channel_name in selected:
            channel = _CHANNELS.get(channel_name)
            if channel is None:
                logger.warning(f"[Dispatcher] unknown channel {channel_name!r} for type={payload.type_code}")
                continue
            try:
                channel.deliver(db, payload)
            except Exception as exc:  # noqa: BLE001 — isolate per-channel failures
                logger.warning(f"[Dispatcher] channel={channel_name} type={payload.type_code} failed: {exc}")
