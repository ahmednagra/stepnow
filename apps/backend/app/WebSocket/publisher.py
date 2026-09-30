# apps/backend/app/WebSocket/publisher.py
# The publish surface for business code. Services call the shorthands AFTER db.commit(),
# best-effort: a failed send is logged inside the manager and never raised. Channels are
# plain topic strings:
#   "admin"        — every admin console socket (operations feed)
#   "user:{id}"    — a single admin user (targeted notifications)
#   "order:{id}"   — watchers of one order's detail view
#
# Per the architecture: there is exactly one manager/publisher. Do not instantiate another.

import asyncio
from collections.abc import Coroutine
from typing import Any

from app.WebSocket.manager import build_event, connection_manager
from app.Utils.Logger import get_logger

logger = get_logger("websocket")

# The server loop owns every socket; sync code (services, BackgroundTasks in the threadpool) must
# hand sends to it rather than asyncio.run() a private loop — that writes to a transport from a
# foreign thread and raises outright when called on the loop thread. Bound in main.lifespan.
_loop: asyncio.AbstractEventLoop | None = None
_pending: set[asyncio.Task] = set()


def bind_loop(loop: asyncio.AbstractEventLoop | None) -> None:
    global _loop
    _loop = loop


def emit_soon(coro: Coroutine[Any, Any, None]) -> None:
    """Fire-and-forget a publish from sync code. Without a bound loop (scripts, tests) there are
    no sockets to reach, so the send is dropped."""
    if _loop is None or _loop.is_closed():
        coro.close()
        return
    try:
        on_loop = asyncio.get_running_loop() is _loop
    except RuntimeError:
        on_loop = False
    if on_loop:
        # Runs once the current (sync) handler yields — i.e. after it has committed.
        task = _loop.create_task(coro)
        _pending.add(task)
        task.add_done_callback(_pending.discard)
    else:
        asyncio.run_coroutine_threadsafe(coro, _loop)


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
