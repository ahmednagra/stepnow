# apps/backend/scripts/seeders/seed_parcel_orders.py
# Idempotent seeder for demo COURIER ORDERS that exercises the full chain:
#   order (CourierOrdersService) → delivery lifecycle → optional invoice (InvoicesService)
#   → optional payment (PaymentsService, which derives paid-status/balance).
#
# Idempotent by a "SEED_REF:<ref>" marker written into order.internal_notes. Depends on
# seed_customers + seed_drivers (run those first — enforced by SEEDERS_IN_ORDER).

from decimal import Decimal
from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402

# advance: forward-only delivery steps to apply after creation.
# bill: create an invoice; paid: also record a full payment (marks invoice paid + order completed).
ORDERS = [
    {
        "ref": "courier-001",
        "customer_email": "sabine.keller@example.de",
        "driver_email": "murat.yilmaz@step-now.de",
        "pickup": "Marktstraße 12",
        "pickup_city": "Plochingen",
        "destination": "Bahnhofstraße 28",
        "destination_city": "Deizisau",
        "consignee": "A. Demir",
        "parcel_description": "Dokumente, A4-Umschlag",
        "parcel_quantity": 1,
        "parcel_weight": "0.50",
        "net": "19.00",
        "vat": "0.19",
        "advance": ["dispatched", "picked_up", "delivered"],
        "bill": True,
        "paid": True,
    },
    {
        "ref": "courier-002",
        "customer_email": "dispatch@bauer-elektro.de",
        "driver_email": "stefan.wagner@step-now.de",
        "pickup": "Industriestraße 5",
        "pickup_city": "Esslingen",
        "destination": "Industriestraße 40",
        "destination_city": "Wernau",
        "consignee": "Lager Wernau",
        "parcel_description": "Ersatzteile, 1 Karton",
        "parcel_quantity": 1,
        "parcel_weight": "6.20",
        "net": "45.00",
        "vat": "0.19",
        "advance": ["dispatched", "picked_up"],
        "bill": True,
        "paid": False,
    },
    {
        "ref": "courier-003",
        "customer_email": "aylin.demir@example.de",
        "driver_email": None,
        "pickup": "Bahnhofstraße 28",
        "pickup_city": "Deizisau",
        "destination": "Pliensaustraße 10",
        "destination_city": "Esslingen",
        "consignee": "Praxis Dr. Vogel",
        "parcel_description": "Kleinpaket",
        "parcel_quantity": 2,
        "parcel_weight": "1.10",
        "net": "24.00",
        "vat": "0.19",
        "advance": [],
        "bill": False,
        "paid": False,
    },
]


def run() -> None:
    log_section(f"Parcel orders ({len(ORDERS)} orders)")
    db = SessionLocal()
    try:
        from app.Models.orders import Order
        from app.Models.customers import Customer
        from app.Models.drivers import Driver
        from app.Schemas.admin.courier_admin import ParcelOrderCreate
        from app.Schemas.admin.orders_admin import InvoiceCreateFromOrder, PaymentCreate
        from app.Services.CourierOrdersService import CourierOrdersService
        from app.Services.InvoicesService import InvoicesService
        from app.Services.PaymentsService import PaymentsService

        actor = get_system_actor(db)
        created = skipped = 0
        for od in ORDERS:
            ref = od["ref"]
            existing = (
                db.query(Order)
                .filter(Order.internal_notes.like(f"%SEED_REF:{ref}%"))
                .first()
            )
            if existing:
                log_skip(
                    f"parcel order '{ref}'", f"order_number={existing.order_number}"
                )
                skipped += 1
                continue

            cust = (
                db.query(Customer)
                .filter(Customer.email == od["customer_email"])
                .first()
            )
            if not cust:
                print(
                    f"  [warn] customer '{od['customer_email']}' not found — run seed_customers first"
                )
                continue
            drv = (
                db.query(Driver).filter(Driver.email == od["driver_email"]).first()
                if od.get("driver_email")
                else None
            )

            payload = ParcelOrderCreate(
                customer_id=cust.id,
                driver_id=drv.id if drv else None,
                pickup_address=od["pickup"],
                pickup_city=od.get("pickup_city"),
                destination_address=od["destination"],
                destination_city=od.get("destination_city"),
                consignee=od.get("consignee"),
                parcel_description=od.get("parcel_description"),
                parcel_quantity=od.get("parcel_quantity", 1),
                parcel_weight_kg=Decimal(od["parcel_weight"])
                if od.get("parcel_weight")
                else None,
                net_amount=Decimal(od["net"]),
                vat_rate=Decimal(od["vat"]),
                payment_due_days=14,
                service_description="Kuriersendung (Seed)",
                internal_notes=f"SEED_REF:{ref}",
            )
            order = CourierOrdersService.create_manual(db, payload, actor, request=None)

            for step in od.get("advance", []):
                CourierOrdersService.set_delivery_status(
                    db, order.id, step, actor, request=None
                )

            billing = ""
            if od.get("bill"):
                inv = InvoicesService.create_from_order(
                    db,
                    order.id,
                    InvoiceCreateFromOrder(
                        payment_due_days=14, recipient_block=order.customer_name
                    ),
                    actor,
                    request=None,
                )
                billing = f", invoice={inv.invoice_number}"
                if od.get("paid"):
                    PaymentsService.record(
                        db,
                        order.id,
                        PaymentCreate(
                            amount=order.gross_amount,
                            method="bank_transfer",
                            invoice_id=inv.id,
                            reference=f"SEED-{ref}",
                        ),
                        actor,
                        request=None,
                    )
                    billing += ", paid"

            log_create(
                f"parcel order '{ref}'",
                f"order_number={order.order_number}, delivery={order.delivery_status}{billing}",
            )
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
