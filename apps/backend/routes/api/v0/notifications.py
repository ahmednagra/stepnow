# apps/backend/routes/api/v0/notifications.py
# Admin notification panel endpoints. Recipient is always the authenticated admin (actor.id),
# never a path/query param — you can only read your own inbox. Literal routes (unread-count,
# read-all) are declared ABOVE the parameterized {notification_id} route so they aren't
# swallowed (route-ordering rule).

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from config.database import get_db
from app.Http.Controllers.NotificationController import NotificationController
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.notifications.notification import (
    MarkReadRequest,
    NotificationResponse,
    UnreadCountResponse,
)
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/notifications", tags=["admin: notifications"])


@router.get("", response_model=PaginatedResponse[NotificationResponse])
async def list_notifications(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
) -> PaginatedResponse[NotificationResponse]:
    return NotificationController.list(db, actor, page, size, unread_only)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UnreadCountResponse:
    return NotificationController.unread_count(db, actor)


@router.post("/read", response_model=UnreadCountResponse)
async def mark_read(payload: MarkReadRequest, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UnreadCountResponse:
    return NotificationController.mark_read(db, actor, payload.ids)


@router.post("/read-all", response_model=UnreadCountResponse)
async def mark_all_read(db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UnreadCountResponse:
    return NotificationController.mark_all_read(db, actor)


@router.post("/{notification_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive(notification_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    NotificationController.archive(db, actor, notification_id)
