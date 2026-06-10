# apps/backend/app/Models/notification.py
# Durable in-app notification inbox. One row per recipient (fan-out on write). Powers the
# admin notification panel + history; survives disconnect/refresh. Realtime push is a separate
# best-effort concern (DatabaseChannel emits over WebSocket after the row commits).
#
# Conventions mirrored from sibling models: PgUUID PK, TimestampMixin + SoftDeleteMixin,
# composite index for the panel's hot query (recipient + unread + recency). JSONB attribute is
# context-prefixed (notification_data), never "metadata".

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class Notification(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "notifications"
    __table_args__ = (
        # Panel query: WHERE recipient_id = ? AND is_read = false ORDER BY created_at DESC
        Index("ix_notifications_recipient_unread", "recipient_id", "is_read", "created_at"),
        Index("ix_notifications_type", "type"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)

    recipient_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("admin_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Code-registry type string, e.g. "order.created" (see Notifications/types.py).
    type: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False, default="general")

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Deep-link the panel uses to open the related resource, e.g. "/admin/orders/{id}".
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Arbitrary structured context (order_number, amounts, etc.). Never named "metadata".
    notification_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
