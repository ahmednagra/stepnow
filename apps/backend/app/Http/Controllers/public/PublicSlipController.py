# apps/backend/app/Http/Controllers/public/PublicSlipController.py
# Thin controller for the unauthenticated driver PDF download. Orchestrates across services
# (the established pattern in this codebase — see CourierController). Maps service exceptions
# to HTTP and schedules the post-response notification. Route → Controller → Service.

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Core.Exceptions import ConflictError, NotFoundError
from app.Services.DriverSlipPdfService import DriverSlipPdfService
from app.Services.OrdersService import OrdersService
from app.Services.message_delivery.MessageDeliveryService import MessageDeliveryService


class PublicSlipController:

    @staticmethod
    def download(db: Session, public_code: str, background_tasks) -> str:
        """Validate + stamp via the service, ensure the PDF via the renderer service, schedule
        the notification, return the absolute PDF path for the route to stream.
        Raises HTTPException(404/410)."""
        try:
            row = MessageDeliveryService.claim_download(db, public_code)
        except NotFoundError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
        except ConflictError:
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="This link has expired")

        order = OrdersService.get(db, row.source_entity_id)
        abs_path = DriverSlipPdfService.ensure(db, order)

        background_tasks.add_task(MessageDeliveryService.notify_download, str(row.id))
        return abs_path
