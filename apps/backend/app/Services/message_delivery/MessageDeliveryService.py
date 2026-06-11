# apps/backend/app/Services/message_delivery/MessageDeliveryService.py
# Business logic for outbound message-delivery records. Owns the transaction for WhatsApp
# web-click initiation and for the public PDF-download stamp. Reuses the existing slip
# renderer (DriverSlipPdfService) and notification facade (NotificationService) — this
# service never re-implements rendering or emits a socket directly.
#
# Layering: SERVICE (③). No HTTP imports. DB calls are sync, never awaited. Raises
# app.Core.Exceptions for callers (controllers) to surface.

import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from uuid import UUID

from sqlalchemy.orm import Session

from config.settings import settings
import asyncio

from app.Core.Exceptions import ConflictError, NotFoundError
from app.Models.admin import AdminUser
from app.Models.message_delivery import MessageDelivery
from app.Models.orders import Order
from app.Services.Notifications import NotificationService
from config.database import SessionLocal
from app.Utils.Logger import get_logger


logger = get_logger("message_delivery")

_TOKEN_TTL_HOURS = 24
_PUBLIC_CODE_BYTES = 8          # ~11 urlsafe chars → short link
_PUBLIC_CODE_MAX_TRIES = 5      # collision retry (unique index is the real guarantee)


class MessageDeliveryService:

    # ── helpers ───────────────────────────────────────────────────────
    @staticmethod
    def _new_public_code(db: Session) -> str:
        # Short, opaque, unique. The unique index is authoritative; this just avoids the
        # (vanishingly rare) insert-time collision so the caller gets a clean code.
        for _ in range(_PUBLIC_CODE_MAX_TRIES):
            code = secrets.token_urlsafe(_PUBLIC_CODE_BYTES)[:16]
            exists = (
                db.query(MessageDelivery.id)
                .filter(MessageDelivery.public_code == code)
                .first()
            )
            if not exists:
                return code
        raise ConflictError("Could not allocate a unique link code, please retry")

    @staticmethod
    def _public_url(public_code: str) -> str:
        base = settings.FRONTEND_URL.rstrip("/")
        return f"{base}/p/s/{public_code}"

    @staticmethod
    def _wa_link(phone: str, text: str) -> str:
        # wa.me deep link: digits only in the path, URL-encoded prefilled text.
        digits = "".join(ch for ch in phone if ch.isdigit())
        return f"https://wa.me/{digits}?text={quote(text)}"

    @staticmethod
    def _slip_message(order: Order, driver_name: str, public_url: str) -> str:
        # German prefilled WhatsApp text. The PDF rides as a link (deep links can't attach
        # files); opening it is what stamps the download.
        return (
            f"Hallo {driver_name},\n\n"
            f"neuer Fahrauftrag {order.order_number}.\n"
            f"Abholung: {order.pickup_address}\n"
            f"Zielort: {order.destination_address}\n\n"
            f"Vollständiger Fahrauftrag (PDF):\n{public_url}\n\n"
            f"— StepNow Rides & Movers"
        )

    # ── WhatsApp web-click initiation (transaction owner) ─────────────
    @staticmethod
    def initiate_whatsapp_slip(
        db: Session,
        order: Order,
        driver,                       # app.Models.drivers.Driver (typed loosely to avoid import cycle)
        triggered_by_user_id: UUID | None,
    ) -> MessageDelivery:
        """Create the delivery row + short tokenized link, return the row (with deep_link).

        Guards live in the controller (driver/phone presence). This method assumes a driver
        with a phone and an order whose slip PDF has already been ensured.
        """
        if not driver or not driver.phone:
            # Defensive: should be caught by the controller, but never build a wa.me with no number.
            raise ConflictError("Assigned driver has no phone number")

        now = datetime.now(timezone.utc)
        code = MessageDeliveryService._new_public_code(db)
        public_url = MessageDeliveryService._public_url(code)
        body = MessageDeliveryService._slip_message(order, driver.full_name, public_url)
        wa_link = MessageDeliveryService._wa_link(driver.phone, body)

        row = MessageDelivery(
            channel="whatsapp",
            delivery_method="web_click",
            provider=None,
            status="initiated",
            recipient_type="driver",
            recipient_id=driver.id,
            recipient_address=driver.phone,
            recipient_name=driver.full_name,
            source_entity_type="courier_order",
            source_entity_id=order.id,
            template_key="driver_slip",
            public_code=code,
            token_expires_at=now + timedelta(hours=_TOKEN_TTL_HOURS),
            deep_link=wa_link,
            message_body=body,
            triggered_by_user_id=triggered_by_user_id,
            initiated_at=now,
            delivery_metadata={"order_number": order.order_number},
        )
        db.add(row)
        db.flush()   # caller (controller) commits with the rest of the send transaction
        logger.info(f"[MessageDelivery.initiate_whatsapp_slip] order={order.order_number} code={code}")
        return row

    # ── Public download stamp (transaction owner) ─────────────────────
    @staticmethod
    def resolve_for_download(db: Session, public_code: str) -> MessageDelivery:
        """Look up a live delivery row by its public code. Raises NotFound (404) if unknown,
        ConflictError (mapped to 410 by the controller) if the link has expired."""
        row = (
            db.query(MessageDelivery)
            .filter(
                MessageDelivery.public_code == public_code,
                MessageDelivery.is_deleted == False,  # noqa: E712
            )
            .first()
        )
        if not row:
            raise NotFoundError("Link not found", public_code=public_code)

        now = datetime.now(timezone.utc)
        if row.token_expires_at and row.token_expires_at < now:
            raise ConflictError("This link has expired")
        return row

    @staticmethod
    def mark_downloaded(db: Session, row: MessageDelivery) -> MessageDelivery:
        """Stamp the download. First open sets downloaded_at + advances status; every open
        increments download_count. Status never regresses. Commits its own transaction."""
        now = datetime.now(timezone.utc)
        first = row.downloaded_at is None
        if first:
            row.downloaded_at = now
        row.download_count = (row.download_count or 0) + 1
        # Forward-only: never overwrite a more advanced state (e.g. a future 'read').
        if row.status in ("initiated", "sent"):
            row.status = "downloaded"
        db.commit()
        db.refresh(row)
        logger.info(
            f"[MessageDelivery.mark_downloaded] code={row.public_code} "
            f"first={first} count={row.download_count}"
        )
        return row

    @staticmethod
    def claim_download(db: Session, public_code: str) -> MessageDelivery:
        """Resolve + validate the token and stamp the download. Returns the row. Raises
        NotFoundError / ConflictError for the controller to map to 404 / 410. The controller
        orchestrates PDF rendering (cross-service) and the notification, per this codebase's
        controller-orchestrates pattern."""
        row = MessageDeliveryService.resolve_for_download(db, public_code)  # raises NotFound/Conflict
        MessageDeliveryService.mark_downloaded(db, row)
        return row

    @staticmethod
    def notify_download(delivery_id: str) -> None:
        """Best-effort dispatcher notification after a driver download. Opens its own session
        (runs from BackgroundTasks). Never raises — a notification failure must not affect the
        driver's download."""

        db = SessionLocal()
        try:
            row = db.get(MessageDelivery, delivery_id)
            if not row:
                return
            order = db.query(Order).filter(Order.id == row.source_entity_id).first()
            if not order:
                return
            admins = db.query(AdminUser).filter(AdminUser.is_deleted == False).all()  # noqa: E712
            if not admins:
                return
            send_to_many = getattr(NotificationService, "send_to_many", None)
            if send_to_many is None:
                logger.warning("[MessageDelivery.notify_download] send_to_many unavailable — skipped")
                return
            asyncio.run(
                send_to_many(
                    recipients=[
                        {"user_id": str(a.id), "user_type": getattr(a, "user_type", "admin")}
                        for a in admins
                    ],
                    notification_type="courier.slip_downloaded",
                    title=f"Fahrauftrag {order.order_number} geöffnet",
                    body=(
                        f"{row.recipient_name or 'Der Fahrer'} hat den Fahrauftrag "
                        f"für Auftrag {order.order_number} heruntergeladen."
                    ),
                    action_url=f"/admin/orders/{order.id}",
                    source_entity_type="courier_order",
                    source_entity_id=str(order.id),
                    notification_metadata={"delivery_id": str(row.id), "download_count": row.download_count},
                    db=db,
                )
            )
        except Exception as exc:  # noqa: BLE001 — best-effort
            logger.warning(f"[MessageDelivery.notify_download] failed: {exc}")
        finally:
            db.close()
