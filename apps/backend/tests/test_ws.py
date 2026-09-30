# apps/backend/tests/test_ws.py
# The admin socket's wire contract with the browser client (hooks/realtime/AdminRealtimeProvider):
# a rejected token closes with 4401 (not a bare handshake failure the client can't tell from a
# network drop), and {"action": "ping"} is answered with {"type": "pong"}. No database: the
# TestClient is used without its context manager, so the lifespan (schema sync) never runs.

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

import main
from routes.api.v0 import ws


def test_rejected_token_closes_with_4401():
    with pytest.raises(WebSocketDisconnect) as exc:
        with TestClient(main.app).websocket_connect("/ws?token=not-a-jwt") as sock:
            sock.receive_text()
    assert exc.value.code == ws.WS_CLOSE_UNAUTHORIZED


def test_ping_is_answered_with_pong(monkeypatch):
    monkeypatch.setattr(ws, "_authenticate", lambda token: SimpleNamespace(id="admin-1"))
    with TestClient(main.app).websocket_connect("/ws?token=t") as sock:
        sock.send_json({"action": "ping"})
        assert sock.receive_json() == {"type": "pong"}
