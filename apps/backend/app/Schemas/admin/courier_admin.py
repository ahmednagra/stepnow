# apps/backend/app/Schemas/admin/courier_admin.py
# Schemas for the parcel-dispatch feature layered on top of the existing orders domain:
# create a manual parcel order, advance the (manual) delivery lifecycle, and send the slip.
# Money is Decimal end-to-end; vat_rate is a fraction (0.07 / 0.19) like orders_admin.py.

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Leistungsart — the four service categories the business bills under.
ServiceType = Literal[
    "Personenbeförderung", "Kuriertransport", "Umzugstransport", "Sonderfahrt"
]


class _InlineCustomer(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    is_business: bool = False
    company_name: str | None = Field(default=None, max_length=200)
    company_vatid: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)


class ParcelOrderCreate(BaseModel):
    """Create a courier order directly (no booking). Either reference an existing
    customer_id OR pass an inline `customer` (which is upserted and linked)."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    customer_id: UUID | None = None
    customer: _InlineCustomer | None = None

    # Vehicle is the PRIMARY anchor of the order; driver is the secondary, free-text person
    # actually driving that vehicle on this run. vehicle_name is NOT accepted from the client —
    # it is snapshotted server-side from the resolved vehicle to keep the label trustworthy.
    # vehicle_id points at the shared vehicles registry (operational fleet rows carry a plate).
    vehicle_id: UUID | None = None
    driver_id: UUID | None = None
    driver_name: str | None = Field(default=None, max_length=200)

    client_reference: str | None = Field(default=None, max_length=100)  # Auftraggeber Ref.-Nr.
    service_type: ServiceType | None = None                              # Leistungsart
    preferred_date: date | None = None                                   # Gewünschter Termin

    pickup_address: str = Field(min_length=1, max_length=500)
    pickup_city: str | None = Field(default=None, max_length=120)
    destination_address: str = Field(min_length=1, max_length=500)
    destination_city: str | None = Field(default=None, max_length=120)
    consignee: str | None = Field(default=None, max_length=200)

    parcel_description: str | None = Field(default=None, max_length=2000)
    parcel_quantity: int = Field(default=1, ge=1, le=9999)
    parcel_weight_kg: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)

    # KM (Abholung→Ziel) planned route distance + Fahrtenbuch logbook (Leer-KM derived).
    distance_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    total_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    occupied_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)

    scheduled_datetime: datetime | None = None

    # all-in flat price (net) + VAT fraction; defaults to 7% reduced rate
    net_amount: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    vat_rate: Decimal | None = Field(default=None, ge=0, le=1)
    payment_due_days: int = Field(default=14, ge=0, le=365)
    service_description: str | None = Field(default=None, max_length=2000)
    internal_notes: str | None = None


class DeliveryStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    delivery_status: str = Field(pattern=r"^(draft|dispatched|picked_up|delivered)$")


class SendSlipRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    to: list[str] = Field(default_factory=lambda: ["driver"])
    channel: str = Field(default="email", pattern=r"^(email|whatsapp)$")


class CourierOrderResponse(BaseModel):
    """Order fields relevant to dispatch, including the derived payment balance."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_number: str
    status: str                 # financial: open|completed|cancelled
    delivery_status: str        # draft|dispatched|picked_up|delivered
    customer_id: UUID | None
    driver_id: UUID | None
    vehicle_id: UUID | None
    vehicle_name: str | None
    driver_name: str | None
    client_reference: str | None
    service_type: str | None
    preferred_date: date | None
    customer_name: str
    customer_phone: str | None
    # Output is lenient: a contact-less transport customer is stored as "" (column is NOT NULL),
    # which is not a valid EmailStr. Inbound email is still strictly validated on _InlineCustomer.
    customer_email: str | None
    pickup_address: str
    pickup_city: str | None
    destination_address: str
    destination_city: str | None
    consignee: str | None
    parcel_description: str | None
    parcel_quantity: int
    parcel_weight_kg: Decimal | None
    distance_km: Decimal | None
    total_km: Decimal | None
    occupied_km: Decimal | None
    scheduled_datetime: datetime | None
    net_amount: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    gross_amount: Decimal
    payment_due_days: int
    due_date: date | None
    dispatched_at: datetime | None
    picked_up_at: datetime | None
    delivered_at: datetime | None
    driver_emailed_at: datetime | None
    created_at: datetime
    whatsapp_link: str | None = None
