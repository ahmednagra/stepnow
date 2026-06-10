# apps/backend/app/WebSocket/events/orders.py
# Order-domain realtime events. Two responsibilities, both thin:
#   1) EventType registry — the canonical "orders.*" type strings (one place to read them).
#   2) Post-commit emit helpers — fire-and-forget fan-out to the admin feed + the per-order
#      channel. These are designed to be scheduled on FastAPI BackgroundTasks AFTER the
#      controller has committed, so a slow/broken socket never blocks or rolls back the request.
#
# Best-effort by construction: every send goes through the manager, which logs+prunes on
# failure and never raises. We also wrap the asyncio bridge so even a loop error is swallowed.

import asyncio
from typing import Any

from app.WebSocket.publisher import emit_to_admin, emit_to_channels
from app.Utils.Logger import get_logger

logger = get_logger("websocket")


class OrderEvent:
    CREATED = "orders.order.created"          # booking converted → order
    UPDATED = "orders.order.updated"          # status / driver / notes changed
    DELETED = "orders.order.deleted"          # soft-deleted
    INVOICE_CREATED = "orders.invoice.created"
    PAYMENT_RECORDED = "orders.payment.recorded"


def _order_channels(order_id: str) -> list[str]:
    return ["admin", f"order:{order_id}"]


async def _emit(event_type: str, order_id: str, data: dict[str, Any], triggered_by: str | None) -> None:
    payload = {"order_id": order_id, **data}
    try:
        await emit_to_channels(event_type, _order_channels(order_id), payload, triggered_by)
    except Exception as exc:  # noqa: BLE001 — realtime is best-effort; never surface to the caller
        logger.warning(f"[OrderEvent.emit] type={event_type} order={order_id} failed: {exc}")


def dispatch_order_event(event_type: str, order_id: str, data: dict[str, Any], actor_id: str | None = None) -> None:
    """Synchronous entry point for BackgroundTasks. Bridges into the event loop and returns
    immediately. Safe to call from controller code after db.commit()."""
    triggered_by = f"user:{actor_id}" if actor_id else None
    try:
        asyncio.run(_emit(event_type, order_id, data, triggered_by))
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"[OrderEvent.dispatch] type={event_type} order={order_id} failed: {exc}")
