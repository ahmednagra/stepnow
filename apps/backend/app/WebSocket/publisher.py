# apps/backend/app/WebSocket/publisher.py
# The publish surface for business code. Services call the shorthands AFTER db.commit(),
# best-effort: a failed send is logged inside the manager and never raised. Channels are
# plain topic strings:
#   "admin"        — every admin console socket (operations feed)
#   "user:{id}"    — a single admin user (targeted notifications)
#   "order:{id}"   — watchers of one order's detail view
#
# Per the architecture: there is exactly one manager/publisher. Do not instantiate another.

from typing import Any

from app.WebSocket.manager import build_event, connection_manager
from app.Utils.Logger import get_logger

logger = get_logger("websocket")


class EventPublisher:
    def __init__(self) -> None:
        self._manager = connection_manager

    async def publish(self, event_type: str, channel: str, data: dict[str, Any], triggered_by: str | None = None) -> None:
        event = build_event(event_type, channel, data, triggered_by)
        await self._manager.broadcast(channel, event)

    async def publish_to_channels(self, event_type: str, channels: list[str], data: dict[str, Any], triggered_by: str | None = None) -> None:
        # One event id shared across channels so a multi-subscribed client de-dupes cleanly.
        primary = channels[0] if channels else ""
        event = build_event(event_type, primary, data, triggered_by)
        await self._manager.broadcast_to_channels(channels, event)


# Global singleton publisher — mirrors the single manager.
event_publisher = EventPublisher()


# ── Shorthands (the import surface for services) ───────────
async def emit_to_admin(event_type: str, data: dict[str, Any], triggered_by: str | None = None) -> None:
    """Publish to the shared admin operations channel."""
    await event_publisher.publish(event_type, "admin", data, triggered_by)


async def emit_to_user(user_id: str, event_type: str, data: dict[str, Any], triggered_by: str | None = None) -> None:
    """Publish to a single admin user's channel."""
    await event_publisher.publish(event_type, f"user:{user_id}", data, triggered_by)


async def emit_to_channels(event_type: str, channels: list[str], data: dict[str, Any], triggered_by: str | None = None) -> None:
    """Publish to several channels at once (de-duped per socket)."""
    await event_publisher.publish_to_channels(event_type, channels, data, triggered_by)
