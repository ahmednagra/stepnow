# apps/backend/app/Http/Controllers/NotificationController.py
# Thin controller for the admin notification panel. Logic lives in NotificationService.

from uuid import UUID

from sqlalchemy.orm import Session

from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.notifications.notification import (
    NotificationResponse,
    UnreadCountResponse,
)
from app.Services.Notifications import NotificationService


class NotificationController:

    @staticmethod
    def list(db: Session, actor: AdminUser, page: int, size: int, unread_only: bool) -> PaginatedResponse[NotificationResponse]:
        offset = (page - 1) * size
        items, total = NotificationService.list_for(db, actor.id, unread_only, size, offset)
        pages = max(1, -(-total // size)) if total else 0
        return PaginatedResponse[NotificationResponse](
            items=[NotificationResponse.model_validate(n) for n in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def unread_count(db: Session, actor: AdminUser) -> UnreadCountResponse:
        return UnreadCountResponse(unread=NotificationService.unread_count(db, actor.id))

    @staticmethod
    def mark_read(db: Session, actor: AdminUser, ids: list[UUID]) -> UnreadCountResponse:
        NotificationService.mark_read(db, actor.id, ids)
        return UnreadCountResponse(unread=NotificationService.unread_count(db, actor.id))

    @staticmethod
    def mark_all_read(db: Session, actor: AdminUser) -> UnreadCountResponse:
        NotificationService.mark_all_read(db, actor.id)
        return UnreadCountResponse(unread=0)

    @staticmethod
    def archive(db: Session, actor: AdminUser, notification_id: UUID) -> None:
        NotificationService.archive(db, actor.id, notification_id)
