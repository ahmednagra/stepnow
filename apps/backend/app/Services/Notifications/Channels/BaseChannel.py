# apps/backend/app/Services/Notifications/Channels/BaseChannel.py
# Abstract channel contract. A channel takes a resolved notification (recipient + content) and
# delivers it over one medium. New channels (push, SMS) subclass this and register one line in
# the dispatcher. Channels are sync at the DB boundary (StepNow has no AsyncSession); any
# realtime/async work is scheduled best-effort and must never raise into the caller.

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session


@dataclass
class NotificationPayload:
    recipient_id: UUID
    type_code: str
    category: str
    title: str
    body: str | None
    link: str | None
    data: dict[str, Any]


class BaseChannel(ABC):
    name: str = "base"

    @abstractmethod
    def deliver(self, db: Session, payload: NotificationPayload) -> None:
        """Deliver one notification over this channel. Must not commit; the facade owns the
        transaction. Must not raise for transport failures — log and move on."""
        raise NotImplementedError
