# apps/backend/routes/api/v0/admin/dashboard.py
# Dashboard aggregation routes. Three GETs that replace the previous size:50/100 list fetches in the dashboard server load (M-3).

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.DashboardController import DashboardController
from app.Models.admin import AdminUser
from app.Schemas.admin.dashboard import (
    BookingsHeatmapResponse,
    DashboardTotalsResponse,
    UpcomingBookingsResponse,
)
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: dashboard"])


@router.get("/admin/dashboard/totals", response_model=DashboardTotalsResponse)
async def get_totals(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> DashboardTotalsResponse:
    return DashboardController.get_totals(db)


@router.get("/admin/bookings/heatmap", response_model=BookingsHeatmapResponse)
async def get_heatmap(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> BookingsHeatmapResponse:
    return DashboardController.heatmap(db)


@router.get("/admin/bookings/upcoming", response_model=UpcomingBookingsResponse)
async def get_upcoming(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    limit: int = Query(4, ge=1, le=50),
) -> UpcomingBookingsResponse:
    return DashboardController.upcoming(db, limit)
