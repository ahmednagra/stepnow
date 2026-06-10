# apps/backend/app/WebSocket/__init__.py
# Public surface of the realtime subsystem. Import the manager/publisher/shorthands from here
# or from their modules — but never construct a second manager.

from app.WebSocket.manager import connection_manager, build_event
from app.WebSocket.publisher import (
    event_publisher,
    emit_to_admin,
    emit_to_user,
    emit_to_channels,
)

__all__ = [
    "connection_manager",
    "build_event",
    "event_publisher",
    "emit_to_admin",
    "emit_to_user",
    "emit_to_channels",
]
