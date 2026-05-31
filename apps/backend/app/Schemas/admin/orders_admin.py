# apps/backend/app/Schemas/admin/orders_admin.py
# Request/response schemas for the orders + optional-billing module.
# Style mirrors app/Schemas/admin/forms_admin.py (extra="forbid" on inputs,
# from_attributes on responses). Money is Decimal end-to-end.

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ─────────────────────────── Orders ───────────────────────────

class OrderCreateFromBooking(BaseModel):
    # The admin confirms the agreed price + terms at conversion time. Customer/route/schedule
    # are pulled from the booking server-side (not trusted from the client).
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    net_amount: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    vat_rate: Decimal | None = Field(default=None, ge=0, le=1, description="e.g. 0.07 or 0.19; defaults to 0.07")
    payment_due_days: int = Field(default=14, ge=0, le=365)
    distance_km: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    driver_name: str | None = Field(default=None, max_length=200)
    vehicle_id: UUID | None = None
    service_description: str | None = Field(default=None, max_length=2000)
    scheduled_datetime: datetime | None = None  # override; defaults to the booking's requested_datetime
    internal_notes: str | None = None


class OrderStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    status: str | None = Field(default=None, pattern=r"^(open|completed|cancelled)$")
    driver_name: str | None = Field(default=None, max_length=200)
    internal_notes: str | None = None


class OrderAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_number: str
    status: str
    booking_id: UUID | None
    service_id: UUID | None
    vehicle_id: UUID | None
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    is_business: bool
    company_name: str | None
    company_vatid: str | None
    pickup_address: str
    pickup_city: str | None
    destination_address: str
    destination_city: str | None
    scheduled_datetime: datetime | None
    passenger_count: int
    luggage_count: int
    distance_km: Decimal | None
    driver_name: str | None
    service_description: str | None
    net_amount: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    gross_amount: Decimal
    payment_due_days: int
    due_date: date | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    internal_notes: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


# ─────────────────────────── Invoices ───────────────────────────

class InvoiceCreateFromOrder(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    issue_date: date | None = None  # defaults to today
    payment_due_days: int = Field(default=14, ge=0, le=365)
    recipient_block: str | None = Field(default=None, max_length=1000)
    tax_number: str | None = Field(default=None, max_length=50)
    surcharge_label: str | None = Field(default=None, max_length=200)
    surcharge_net: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    skonto_pct: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    skonto_days: int | None = Field(default=None, ge=0, le=365)


class InvoiceAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    invoice_number: str
    order_id: UUID
    status: str
    issue_date: date
    recipient_block: str | None
    tax_number: str | None
    net_amount: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    gross_amount: Decimal
    surcharge_label: str | None
    surcharge_net: Decimal | None
    skonto_pct: Decimal | None
    skonto_days: int | None
    payment_due_days: int
    due_date: date | None
    paid_at: datetime | None
    pdf_url: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


# ─────────────────────────── Payments ───────────────────────────

class PaymentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    method: str = Field(default="cash", pattern=r"^(cash|girocard|bank_transfer|paypal|other)$")
    status: str | None = Field(default="received", pattern=r"^(received|pending|refunded|failed)$")
    received_at: datetime | None = None  # defaults to now
    invoice_id: UUID | None = None
    reference: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_id: UUID
    invoice_id: UUID | None
    amount: Decimal
    method: str
    status: str
    received_at: datetime
    reference: str | None
    notes: str | None
    created_at: datetime


# ─────────────────────────── Detail (order + billing + ledger) ───────────────────────────

class OrderDetailResponse(OrderAdminResponse):
    # Everything from OrderAdminResponse, plus the optional invoice, the payment ledger,
    # and the DERIVED amounts (never stored — computed from the payments).
    invoice: InvoiceAdminResponse | None = None
    payments: list[PaymentResponse] = []
    amount_paid: Decimal
    balance_due: Decimal
