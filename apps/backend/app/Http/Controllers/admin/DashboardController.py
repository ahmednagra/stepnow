# apps/backend/app/Http/Controllers/admin/DashboardController.py
# Controller layer for the new /admin/dashboard/* + /admin/bookings/{heatmap,upcoming} routes.

from sqlalchemy.orm import Session
from app.Schemas.admin.dashboard import (
    BookingTotals,
    BookingsHeatmapResponse,
    DashboardTotalsResponse,
    EntityTotals,
    HeatmapCell,
    MessageTotals,
    UpcomingBooking,
    UpcomingBookingsResponse,
)
from app.Services.DashboardService import DashboardService


class DashboardController:

    @staticmethod
    def get_totals(db: Session) -> DashboardTotalsResponse:
        data = DashboardService.get_totals(db)
        return DashboardTotalsResponse(
            services=EntityTotals(**data["services"]),
            vehicles=EntityTotals(**data["vehicles"]),
            bookings=BookingTotals(**data["bookings"]),
            messages=MessageTotals(**data["messages"]),
        )

    @staticmethod
    def heatmap(db: Session) -> BookingsHeatmapResponse:
        data = DashboardService.heatmap(db)
        return BookingsHeatmapResponse(cells=[HeatmapCell(**c) for c in data["cells"]])

    @staticmethod
    def upcoming(db: Session, limit: int) -> UpcomingBookingsResponse:
        data = DashboardService.upcoming(db, limit)
        return UpcomingBookingsResponse(items=[UpcomingBooking.model_validate(b) for b in data["items"]])
