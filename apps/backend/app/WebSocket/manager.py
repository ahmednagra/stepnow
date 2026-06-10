# apps/backend/app/WebSocket/manager.py
# The ONE WebSocket connection manager (singleton). Channel-based: clients subscribe to
# topics ("admin", "user:{id}", "order:{id}"), business code publishes to a channel and the
# manager fans the serialized event out to every subscribed socket. There is exactly one
# instance — `connection_manager`. Never instantiate a second one.
#
# In-process only (single-worker). Redis fan-out can slot in later behind the same public
# surface (connect / disconnect / subscribe / unsubscribe / broadcast) without touching callers.

import asyncio
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import WebSocket

from app.Utils.Logger import get_logger

logger = get_logger("websocket")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_event(event_type: str, channel: str, data: dict[str, Any], triggered_by: str | None = None) -> dict[str, Any]:
    # Wire shape shared by every emit. Kept tiny + JSON-serializable.
    return {
        "id": str(uuid4()),
        "type": event_type,
        "channel": channel,
        "data": data,
        "metadata": {"timestamp": _now_iso(), "triggered_by": triggered_by},
    }


class ConnectionManager:
    def __init__(self) -> None:
        # connection_id -> live socket
        self._sockets: dict[str, WebSocket] = {}
        # channel -> set of connection_ids
        self._subscriptions: dict[str, set[str]] = {}
        # connection_id -> set of channels (reverse index for clean disconnect)
        self._channels_of: dict[str, set[str]] = {}
        self._lock = asyncio.Lock()

    # ── lifecycle ──────────────────────────────────────────
    async def connect(self, websocket: WebSocket) -> str:
        await websocket.accept()
        connection_id = str(uuid4())
        async with self._lock:
            self._sockets[connection_id] = websocket
            self._channels_of[connection_id] = set()
        logger.info(f"[WS.connect] id={connection_id} total={len(self._sockets)}")
        return connection_id

    async def disconnect(self, connection_id: str) -> None:
        async with self._lock:
            self._sockets.pop(connection_id, None)
            for channel in self._channels_of.pop(connection_id, set()):
                subs = self._subscriptions.get(channel)
                if subs:
                    subs.discard(connection_id)
                    if not subs:
                        self._subscriptions.pop(channel, None)
        logger.info(f"[WS.disconnect] id={connection_id} total={len(self._sockets)}")

    # ── subscriptions ──────────────────────────────────────
    async def subscribe(self, connection_id: str, channel: str) -> None:
        async with self._lock:
            if connection_id not in self._sockets:
                return
            self._subscriptions.setdefault(channel, set()).add(connection_id)
            self._channels_of.setdefault(connection_id, set()).add(channel)
        logger.debug(f"[WS.subscribe] id={connection_id} channel={channel}")

    async def unsubscribe(self, connection_id: str, channel: str) -> None:
        async with self._lock:
            subs = self._subscriptions.get(channel)
            if subs:
                subs.discard(connection_id)
                if not subs:
                    self._subscriptions.pop(channel, None)
            chans = self._channels_of.get(connection_id)
            if chans:
                chans.discard(channel)
        logger.debug(f"[WS.unsubscribe] id={connection_id} channel={channel}")

    # ── delivery ───────────────────────────────────────────
    async def broadcast(self, channel: str, event: dict[str, Any]) -> None:
        # Best-effort fan-out to a single channel. Failed sockets are pruned; never raises.
        async with self._lock:
            connection_ids = list(self._subscriptions.get(channel, set()))
            sockets = [(cid, self._sockets.get(cid)) for cid in connection_ids]
        if not sockets:
            return
        message = json.dumps(event, default=str)
        dead: list[str] = []
        for cid, ws in sockets:
            if ws is None:
                dead.append(cid)
                continue
            try:
                await ws.send_text(message)
            except Exception as exc:  # noqa: BLE001 — best-effort transport; log + prune
                logger.warning(f"[WS.broadcast] send failed id={cid} channel={channel}: {exc}")
                dead.append(cid)
        for cid in dead:
            await self.disconnect(cid)

    async def broadcast_to_channels(self, channels: list[str], event: dict[str, Any]) -> None:
        # De-dupe subscribers across channels so a socket subscribed to two of them gets one copy.
        async with self._lock:
            targets: set[str] = set()
            for channel in channels:
                targets |= self._subscriptions.get(channel, set())
            sockets = [(cid, self._sockets.get(cid)) for cid in targets]
        if not sockets:
            return
        message = json.dumps(event, default=str)
        dead: list[str] = []
        for cid, ws in sockets:
            if ws is None:
                dead.append(cid)
                continue
            try:
                await ws.send_text(message)
            except Exception as exc:  # noqa: BLE001
                logger.warning(f"[WS.broadcast_to_channels] send failed id={cid}: {exc}")
                dead.append(cid)
        for cid in dead:
            await self.disconnect(cid)

    def stats(self) -> dict[str, Any]:
        return {
            "connections": len(self._sockets),
            "channels": {ch: len(subs) for ch, subs in self._subscriptions.items()},
        }


# Global singleton — the ONE manager. Import this; never construct another.
connection_manager = ConnectionManager()
