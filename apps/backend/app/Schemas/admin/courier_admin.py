# apps/backend/app/Schemas/admin/courier_admin.py
# Schemas for the parcel-dispatch feature layered on the orders domain:
# create a manual courier order (B2B company customer + ordered route stops), advance the
# delivery lifecycle, and send the slip. Money is Decimal end-to-end; vat_rate is a fraction.
# The route is a list of typed stops — N pickups (Abholung) consolidated into one drop (Ziel).

from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

# Leistungsart — the four service categories the business bills under.
ServiceType = Literal[
    "Personenbeförderung", "Kuriertransport", "Umzugstransport", "Sonderfahrt"
]
StopType = Literal["pickup", "drop"]


class _InlineCustomer(BaseModel):
    # B2B: the customer is a company. company_name is required; contact_person is optional.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    company_name: str = Field(min_length=1, max_length=200)
    contact_person: str | None = Field(default=None, max_length=200)
    is_business: bool = True
    company_vatid: str | None = Field(default=None, max_length=50)
    tax_number: str | None = Field(default=None, max_length=50)
    street: str | None = Field(default=None, max_length=200)
    plz: str | None = Field(default=None, max_length=20)
    ort: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)


class OrderStopCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    stop_type: StopType
    company: str | None = Field(default=None, max_length=200)  # Firma at Beladeort/Entladeort
    address: str = Field(min_length=1, max_length=500)
    postcode: str | None = Field(default=None, max_length=10)
    city: str | None = Field(default=None, max_length=100)
    contact_name: str | None = Field(default=None, max_length=200)
    contact_phone: str | None = Field(default=None, max_length=50)
    time_from: time | None = None
    time_to: time | None = None
    package_count: int | None = Field(default=None, ge=0, le=99999)
    weight_kg: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    notes: str | None = Field(default=None, max_length=2000)


class OrderStopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sequence: int
    stop_type: str
    status: str
    company: str | None
    address: str
    postcode: str | None
    city: str | None
    contact_name: str | None
    contact_phone: str | None
    time_from: time | None
    time_to: time | None
    package_count: int | None
    weight_kg: Decimal | None
    notes: str | None


class ParcelOrderCreate(BaseModel):
    """Create a courier order directly (no booking). Either reference an existing customer_id
    OR pass an inline `customer` (company — upserted and linked). The route is an ordered list
    of `stops`: one or more 'pickup' stops consolidated into exactly one 'drop'."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    customer_id: UUID | None = None
    customer: _InlineCustomer | None = None

    # Vehicle is the PRIMARY anchor; driver is the secondary free-text person on this run.
    vehicle_id: UUID | None = None
    driver_id: UUID | None = None
    driver_name: str | None = Field(default=None, max_length=200)

    client_reference: str | None = Field(default=None, max_length=100)  # Auftraggeber Ref.-Nr.
    service_type: ServiceType | None = None                              # Leistungsart
    preferred_date: date | None = None                                   # Gewünschter Termin

    # Ordered route — validated to ≥1 pickup + exactly 1 drop (see _validate_stops).
    stops: list[OrderStopCreate] = Field(min_length=2)

    consignee: str | None = Field(default=None, max_length=200)
    parcel_description: str | None = Field(default=None, max_length=2000)
    parcel_quantity: int = Field(default=1, ge=1, le=9999)
    parcel_weight_kg: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)

    # KM (Abholung→Ziel) planned route distance + Fahrtenbuch logbook (Leer-KM derived).
    distance_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    total_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    occupied_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    # Transportauftrag km legs (Anfahrt to load / leg after unload).
    km_to_load: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    km_to_unload: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)

    scheduled_datetime: datetime | None = None

    # all-in flat price (net) + VAT fraction; defaults to 7% reduced rate
    net_amount: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    vat_rate: Decimal | None = Field(default=None, ge=0, le=1)
    payment_due_days: int = Field(default=14, ge=0, le=365)
    service_description: str | None = Field(default=None, max_length=2000)
    internal_notes: str | None = None

    @model_validator(mode="after")
    def _validate_stops(self):
        pickups = [s for s in self.stops if s.stop_type == "pickup"]
        drops = [s for s in self.stops if s.stop_type == "drop"]
        if len(pickups) < 1:
            raise ValueError("At least one pickup stop is required")
        if len(drops) != 1:
            raise ValueError("Exactly one drop (destination) stop is required")
        return self


class DeliveryStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    delivery_status: str = Field(pattern=r"^(draft|dispatched|picked_up|delivered)$")


class SendSlipRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    to: list[str] = Field(default_factory=lambda: ["driver"])
    channel: str = Field(default="email", pattern=r"^(email|whatsapp)$")


class CourierOrderResponse(BaseModel):
    """Order fields relevant to dispatch, including the derived payment balance + route stops."""
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
    # Legacy single-address mirror (first pickup + drop) — kept for PDFs/list; `stops` is canonical.
    pickup_address: str
    pickup_city: str | None
    destination_address: str
    destination_city: str | None
    stops: list[OrderStopResponse] = []
    consignee: str | None
    parcel_description: str | None
    parcel_quantity: int
    parcel_weight_kg: Decimal | None
    distance_km: Decimal | None
    total_km: Decimal | None
    occupied_km: Decimal | None
    km_to_load: Decimal | None
    km_to_unload: Decimal | None
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
