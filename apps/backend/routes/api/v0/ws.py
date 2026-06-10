# apps/backend/routes/api/v0/ws.py
# Realtime endpoint for the admin console. One socket per session; the client passes its
# access token as a query param (?token=...) since browsers can't set Authorization headers
# on a WebSocket handshake. On connect we authenticate (same decode path as get_current_admin),
# auto-subscribe to the shared "admin" feed and the user's own "user:{id}" channel, then accept
# lightweight client commands to (un)subscribe to per-resource channels like "order:{id}".
#
# Mounted directly on the app (not under a router prefix) in setup_api_routes.

from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from config.database import SessionLocal
from app.Core.Exceptions import AuthError
from app.Models.admin import AdminUser
from app.Utils.Helpers import decode_access_token
from app.Utils.Logger import get_logger
from app.WebSocket.manager import connection_manager

logger = get_logger("websocket")

router = APIRouter()

# Only these channel prefixes may be subscribed to from the client side.
_ALLOWED_CLIENT_PREFIXES = ("order:",)


def _authenticate(token: str | None) -> AdminUser | None:
    if not token:
        return None
    try:
        user_id = decode_access_token(token)
        user_uuid = UUID(user_id)
    except (AuthError, ValueError, TypeError):
        return None
    db: Session = SessionLocal()
    try:
        return (
            db.query(AdminUser)
            .filter(AdminUser.id == user_uuid, AdminUser.is_deleted == False, AdminUser.active == True)  # noqa: E712
            .first()
        )
    finally:
        db.close()


@router.websocket("/ws")
async def admin_ws(websocket: WebSocket, token: str | None = Query(default=None)) -> None:
    user = _authenticate(token)
    if not user:
        # 1008 = policy violation; closes before accept-handshake completes meaningful traffic.
        await websocket.close(code=1008)
        return

    connection_id = await connection_manager.connect(websocket)
    await connection_manager.subscribe(connection_id, "admin")
    await connection_manager.subscribe(connection_id, f"user:{user.id}")
    logger.info(f"[WS.admin] connected user={user.id} conn={connection_id}")

    try:
        while True:
            msg = await websocket.receive_json()
            action = (msg or {}).get("action")
            channel = (msg or {}).get("channel", "")
            if action not in ("subscribe", "unsubscribe"):
                continue
            if not isinstance(channel, str) or not channel.startswith(_ALLOWED_CLIENT_PREFIXES):
                continue
            if action == "subscribe":
                await connection_manager.subscribe(connection_id, channel)
            else:
                await connection_manager.unsubscribe(connection_id, channel)
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001 — never let a socket error bubble into the server
        logger.warning(f"[WS.admin] error user={user.id} conn={connection_id}: {exc}")
    finally:
        await connection_manager.disconnect(connection_id)
