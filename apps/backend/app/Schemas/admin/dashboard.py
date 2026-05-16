# apps/backend/app/Schemas/admin/dashboard.py
# Pydantic response models for the new /admin/dashboard/* + /admin/bookings/{heatmap,upcoming} aggregation endpoints. These exist so the dashboard SSR pass can render with COUNT-only queries instead of fetching size:50 lists per entity (fixes M-3).

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class EntityTotals(BaseModel):
    total: int
    active: int


class BookingTotals(BaseModel):
    total: int
    new_count: int


class MessageTotals(BaseModel):
    total: int
    unread: int


class DashboardTotalsResponse(BaseModel):
    services: EntityTotals
    vehicles: EntityTotals
    bookings: BookingTotals
    messages: MessageTotals


class HeatmapCell(BaseModel):
    day: int
    hour: int
    value: int


class BookingsHeatmapResponse(BaseModel):
    cells: list[HeatmapCell]


class UpcomingBooking(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    reference: str
    status: str
    customer_name: str
    pickup_address: str
    pickup_city: str | None
    destination_address: str
    destination_city: str | None
    requested_datetime: datetime


class UpcomingBookingsResponse(BaseModel):
    items: list[UpcomingBooking]
