# apps/backend/scripts/seeders/seed_expenses.py

# nothing changed. Follows the project seeder pattern: idempotent run(), SessionLocal,
# log helpers. Categories keyed by `code`; expenses keyed by `legacy_id` (the JSON "id").

from datetime import date
from decimal import Decimal
from config.database import SessionLocal
from scripts.seeders._base import log_section, log_create, log_skip


# Expense categories referenced by the imported entries (from the legacy KATS).
CATEGORIES = [
    {
        "code": "kraftstoff",
        "label": "⛽ Kraftstoff",
        "paragraph": "§4 EStG",
        "vst_deductible": True,
        "is_private": False,
        "sort_order": 10,
    },
]

# Expenses — 100% identical to StepNow_Data.json (no values changed).
EXPENSES = [
    {
        "legacy_id": 1,
        "typ": "Ausgabe",
        "expense_date": date(2026, 4, 1),
        "receipt_no": "A 011426",
        "description": "Agip - Esslingen",
        "net_amount": Decimal("29.15"),
        "vat_rate": Decimal("0.19"),
        "vat_amount": Decimal("5.5385"),
        "gross_amount": Decimal("34.6885"),
        "input_tax": Decimal("5.5385"),
        "vehicle_name": "SN 9889",
        "vehicle_type": "firm",
        "status": "Bezahlt",
        "category_code": "kraftstoff",
        "km_total": 0,
        "km_occupied": 0,
        "km_empty": 0,
        "private_km": 0,
        "payment_term_days": 0,
        "due_date": None,
        "created_on": date(2026, 4, 3),
    },
    {
        "legacy_id": 2,
        "typ": "Ausgabe",
        "expense_date": date(2026, 4, 1),
        "receipt_no": "A 021426",
        "description": "Aral Stuttgart",
        "net_amount": Decimal("12.97"),
        "vat_rate": Decimal("0.19"),
        "vat_amount": Decimal("2.4643"),
        "gross_amount": Decimal("15.4343"),
        "input_tax": Decimal("2.4643"),
        "vehicle_name": "SN 9889",
        "vehicle_type": "firm",
        "status": "Bezahlt",
        "category_code": "kraftstoff",
        "km_total": 0,
        "km_occupied": 0,
        "km_empty": 0,
        "private_km": 0,
        "payment_term_days": 0,
        "due_date": None,
        "created_on": date(2026, 4, 3),
    },
]


def run() -> None:
    log_section(f"Expenses ({len(CATEGORIES)} categories, {len(EXPENSES)} expenses)")
    db = SessionLocal()
    try:
        from app.Models.expense_categories import ExpenseCategory
        from app.Models.expenses import Expense

        # 1) Categories first (FK target for expenses.category_code).
        c_created = c_skipped = 0
        for c in CATEGORIES:
            if (
                db.query(ExpenseCategory)
                .filter(ExpenseCategory.code == c["code"])
                .first()
            ):
                log_skip(f"category '{c['code']}'")
                c_skipped += 1
                continue
            db.add(ExpenseCategory(**c))
            log_create(f"category '{c['code']}'", c["label"])
            c_created += 1
        db.commit()

        # 2) Expenses — skip by legacy_id so re-running never duplicates or mutates.
        e_created = e_skipped = 0
        for e in EXPENSES:
            if db.query(Expense).filter(Expense.legacy_id == e["legacy_id"]).first():
                log_skip(f"expense legacy_id={e['legacy_id']}")
                e_skipped += 1
                continue
            db.add(Expense(**e))
            log_create(
                f"expense '{e['receipt_no']}'",
                f"{e['gross_amount']} € — {e['description']}",
            )
            e_created += 1
        db.commit()

        print(
            f"  [done] categories: {c_created} created / {c_skipped} skipped; "
            f"expenses: {e_created} created / {e_skipped} skipped"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
