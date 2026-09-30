# apps/backend/app/Schemas/admin/vehicles.py
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int = 0
    active: bool = True
    # public_visible=False marks an operational-only fleet car (kept off the public showcase).
    public_visible: bool = True
    plate: str | None = Field(default=None, max_length=50)
    ownership_type: str | None = Field(default=None, max_length=10)
    name_de: str = Field(min_length=1, max_length=200)
    name_en: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)
    capacity_passengers: int = Field(ge=1, le=50)
    capacity_luggage: int = Field(ge=0, le=50, default=0)
    features_de: list[str] = Field(default_factory=list, max_length=30)
    features_en: list[str] = Field(default_factory=list, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)


class VehicleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sort_order: int | None = None
    active: bool | None = None
    public_visible: bool | None = None
    plate: str | None = Field(default=None, max_length=50)
    ownership_type: str | None = Field(default=None, max_length=10)
    name_de: str | None = Field(default=None, min_length=1, max_length=200)
    name_en: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    capacity_passengers: int | None = Field(default=None, ge=1, le=50)
    capacity_luggage: int | None = Field(default=None, ge=0, le=50)
    features_de: list[str] | None = Field(default=None, max_length=30)
    features_en: list[str] | None = Field(default=None, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)


class VehicleAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sort_order: int
    active: bool
    public_visible: bool
    plate: str | None
    ownership_type: str | None
    name_de: str
    name_en: str
    category: str
    capacity_passengers: int
    capacity_luggage: int
    features_de: list[str]
    features_en: list[str]
    image_url: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

# ── Per-vehicle ledger (account) — uses ORDER amounts, never invoice amounts ──
class VehicleLedgerOrder(BaseModel):
    order_id: UUID
    order_number: str
    date: "date | None"
    customer_name: str
    route_from: str | None
    route_to: str | None
    net_amount: "Decimal"
    gross_amount: "Decimal"
    currency: str
    amount_paid: "Decimal"
    balance_due: "Decimal"
    status: str


class VehicleLedgerTotals(BaseModel):
    count: int
    net: "Decimal"
    gross: "Decimal"
    paid: "Decimal"
    balance: "Decimal"


class VehicleLedgerResponse(BaseModel):
    vehicle_id: UUID
    vehicle_label: str
    date_from: "date | None" = None
    date_to: "date | None" = None
    orders: list[VehicleLedgerOrder]
    totals: VehicleLedgerTotals
