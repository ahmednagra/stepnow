# apps/backend/app/Services/Notifications/__init__.py
# Facade is the only import surface (per the wiring rules). External callers do:
#     from app.Services.Notifications import NotificationService
# and never reach into Dispatcher / Channels / types directly.

from app.Services.Notifications.NotificationService import NotificationService

__all__ = ["NotificationService"]
