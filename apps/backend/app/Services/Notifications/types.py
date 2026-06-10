# apps/backend/app/Services/Notifications/types.py
# Code-level notification type registry (no DB table — same idea as the WS event-type strings).
# Each type maps to a category (used for grouping/retention) and the default channels it fans
# out to. Features reference these constants instead of hardcoding strings.

from dataclasses import dataclass, field


@dataclass(frozen=True)
class NotificationType:
    code: str
    category: str
    default_channels: tuple[str, ...] = field(default_factory=lambda: ("database",))


# ── Orders domain ──────────────────────────────────────────
ORDER_CREATED = NotificationType("order.created", "orders", ("database",))
ORDER_UPDATED = NotificationType("order.updated", "orders", ("database",))
ORDER_DELETED = NotificationType("order.deleted", "orders", ("database",))
INVOICE_CREATED = NotificationType("order.invoice_created", "orders", ("database",))
PAYMENT_RECORDED = NotificationType("order.payment_recorded", "orders", ("database",))


NOTIFICATION_TYPES: dict[str, NotificationType] = {
    t.code: t
    for t in (
        ORDER_CREATED,
        ORDER_UPDATED,
        ORDER_DELETED,
        INVOICE_CREATED,
        PAYMENT_RECORDED,
    )
}


def resolve_type(code: str) -> NotificationType:
    # Unknown codes degrade gracefully to a database-only "general" notification.
    return NOTIFICATION_TYPES.get(code, NotificationType(code, "general", ("database",)))
