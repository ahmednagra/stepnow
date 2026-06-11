# apps/backend/app/Models/message_delivery.py
# Channel-agnostic outbound delivery ledger. One row per (recipient, channel) send.
# WhatsApp web-click uses it now; email keeps email_logs; SMS/push slot in later with no
# schema change. Status is tracked via the `status` string against the delivery lifecycle
# (initiated → sent → downloaded for web-click; queued → sent → delivered → read for a
# future paid API). The short `public_code` backs the driver's tokenized PDF link; the
# server stamps `downloaded_at`/`download_count` when that link is hit — a first-party,
# provable "the driver opened the slip" signal the web flow cannot otherwise observe.
#
# Additive + nullable throughout; soft-deletable and timestamped like every other entity.

from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin


class MessageDelivery(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "message_deliveries"
    __table_args__ = (
        Index("ix_message_deliveries_source", "source_entity_type", "source_entity_id"),
        Index("ix_message_deliveries_channel_status", "channel", "status"),
        Index("ix_message_deliveries_provider_msg", "provider", "provider_message_id"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)

    # ── What channel / how ──
    channel: Mapped[str] = mapped_column(String(20), nullable=False, index=True)         # whatsapp | email | sms
    delivery_method: Mapped[str] = mapped_column(String(20), nullable=False)             # web_click | business_api | smtp
    provider: Mapped[str | None] = mapped_column(String(30), nullable=True)              # twilio | meta | smtp; null for web_click
    # Lifecycle state (string, mirrors Order.delivery_status convention in this codebase):
    #   initiated → sent → downloaded   (web_click)
    #   queued → sent → delivered → read (future api)   | failed (any stage)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="initiated", index=True)

    # ── Who / where ──
    recipient_type: Mapped[str] = mapped_column(String(20), nullable=False)              # driver | customer
    recipient_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    recipient_address: Mapped[str | None] = mapped_column(String(200), nullable=True)    # E.164 phone (WA) / email
    recipient_name: Mapped[str | None] = mapped_column(String(200), nullable=True)       # snapshot for audit/notification

    # ── What it's about (polymorphic source) ──
    source_entity_type: Mapped[str] = mapped_column(String(40), nullable=False)          # courier_order
    source_entity_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    template_key: Mapped[str | None] = mapped_column(String(60), nullable=True)          # driver_slip

    # ── Web-click specifics ──
    public_code: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True, index=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deep_link: Mapped[str | None] = mapped_column(Text, nullable=True)                   # the wa.me URL we built
    message_body: Mapped[str | None] = mapped_column(Text, nullable=True)               # exact text we generated (audit)

    # ── Download tracking (first-party proof) ──
    downloaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    download_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    # ── Future paid-API fields ──
    provider_message_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    error_code: Mapped[str | None] = mapped_column(String(60), nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_events: Mapped[list | None] = mapped_column(JSONB, nullable=True)           # append-only raw webhook log

    # ── Context + audit ──
    delivery_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)         # context-prefixed (never 'metadata')
    triggered_by_user_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    initiated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
