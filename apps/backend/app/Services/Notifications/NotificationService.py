# apps/backend/app/Services/Notifications/NotificationService.py
# The ONE public facade for notifications. Features import only this. It both EMITS (fan-out to
# recipients via the dispatcher) and READS (panel queries). Static-method + soft-delete pattern,
# matching OrdersService / CustomersService. The facade flushes inside the caller's transaction;
# the caller owns the commit (so a notification and its triggering write land atomically).

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.Models.admin import AdminUser
from app.Models.notification import Notification
from app.Services.Notifications.Channels.BaseChannel import NotificationPayload
from app.Services.Notifications.NotificationDispatcher import NotificationDispatcher
from app.Services.Notifications.types import resolve_type
from app.Utils.Logger import get_logger

logger = get_logger("notifications")


class NotificationService:

    # ── Emit ───────────────────────────────────────────────
    @staticmethod
    def notify(
        db: Session,
        recipient_id: UUID,
        type_code: str,
        title: str,
        body: str | None = None,
        link: str | None = None,
        data: dict | None = None,
        channels: tuple[str, ...] | None = None,
    ) -> None:
        """Fan out one notification to a single recipient. Flushes; caller commits."""
        type_def = resolve_type(type_code)
        payload = NotificationPayload(
            recipient_id=recipient_id,
            type_code=type_code,
            category=type_def.category,
            title=title,
            body=body,
            link=link,
            data=data or {},
        )
        NotificationDispatcher.dispatch(db, payload, channels)

    @staticmethod
    def notify_all_admins(
        db: Session,
        type_code: str,
        title: str,
        body: str | None = None,
        link: str | None = None,
        data: dict | None = None,
        channels: tuple[str, ...] | None = None,
        exclude_id: UUID | None = None,
    ) -> None:
        """Fan out to every active admin (operations notifications). One row per recipient."""
        admins = (
            db.query(AdminUser)
            .filter(AdminUser.is_deleted == False, AdminUser.active == True)  # noqa: E712
            .all()
        )
        for admin in admins:
            if exclude_id and admin.id == exclude_id:
                continue
            NotificationService.notify(
                db, admin.id, type_code, title, body=body, link=link, data=data, channels=channels
            )

    # ── Read (panel) ───────────────────────────────────────
    @staticmethod
    def list_for(db: Session, recipient_id: UUID, unread_only: bool, limit: int, offset: int):
        q = db.query(Notification).filter(
            Notification.recipient_id == recipient_id,
            Notification.is_deleted == False,  # noqa: E712
            Notification.is_archived == False,  # noqa: E712
        )
        if unread_only:
            q = q.filter(Notification.is_read == False)  # noqa: E712
        total = q.count()
        items = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def unread_count(db: Session, recipient_id: UUID) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.is_deleted == False,  # noqa: E712
                Notification.is_read == False,  # noqa: E712
                Notification.is_archived == False,  # noqa: E712
            )
            .scalar()
            or 0
        )

    @staticmethod
    def mark_read(db: Session, recipient_id: UUID, ids: list[UUID]) -> int:
        now = datetime.now(timezone.utc)
        updated = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.id.in_(ids),
                Notification.is_read == False,  # noqa: E712
                Notification.is_deleted == False,  # noqa: E712
            )
            .update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
        )
        db.commit()
        return updated

    @staticmethod
    def mark_all_read(db: Session, recipient_id: UUID) -> int:
        now = datetime.now(timezone.utc)
        updated = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.is_read == False,  # noqa: E712
                Notification.is_deleted == False,  # noqa: E712
            )
            .update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
        )
        db.commit()
        return updated

    @staticmethod
    def archive(db: Session, recipient_id: UUID, notification_id: UUID) -> None:
        row = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.recipient_id == recipient_id,
                Notification.is_deleted == False,  # noqa: E712
            )
            .first()
        )
        if not row:
            return
        row.is_archived = True
        db.commit()
