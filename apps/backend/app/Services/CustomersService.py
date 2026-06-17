# apps/backend/app/Services/CustomersService.py
# Business logic for customers + the repeat-customer search (name OR phone).
# Adds per-customer aggregates (order count, lifetime gross, outstanding balance,
# overdue balance, last-order date) computed in a single grouped query so the
# Customers list can show value/receivables/recency without an N+1 per row.

from datetime import datetime, timezone, date
from uuid import UUID
from fastapi import Request
from sqlalchemy import or_, func, case
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.customers import Customer
from app.Models.orders import Order
from app.Models.payments import Payment
from app.Services.AuditService import AuditService
from app.Utils.finance import money


class CustomersService:

    @staticmethod
    def _snapshot(c: Customer) -> dict:
        return {"company_name": c.company_name, "contact_person": c.contact_person, "email": c.email, "phone": c.phone}

    @staticmethod
    def customers_list(db: Session, page: int, size: int, q: str | None, include_deleted: bool):
        query = db.query(Customer)
        if not include_deleted:
            query = query.filter(Customer.is_deleted == False)  # noqa: E712
        if q:
            like = f"%{q.strip()}%"
            digits = "".join(ch for ch in q if ch.isdigit())
            conds = [
                Customer.company_name.ilike(like),
                Customer.contact_person.ilike(like),
                Customer.email.ilike(like),
                Customer.company_vatid.ilike(like),
            ]
            if digits:
                conds.append(Customer.phone.ilike(f"%{digits}%"))
            query = query.filter(or_(*conds))
        total = query.count()
        items = (
            query.order_by(Customer.company_name.asc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        return items, total

    @staticmethod
    def aggregates_for(db: Session, customer_ids: list[UUID]) -> dict[UUID, dict]:
        """Per-customer order rollups for the given ids, in one grouped query.

        Returns {customer_id: {orders_count, total_billed, balance_due,
        overdue_balance, last_order_at}}. Balance mirrors the ledger logic used
        elsewhere: gross − sum(received payments). Overdue = unpaid AND past due_date.
        """
        if not customer_ids:
            return {}

        today = date.today()

        # Per-order received-payments subquery (received, not soft-deleted).
        paid_sq = (
            db.query(
                Payment.order_id.label("order_id"),
                func.coalesce(func.sum(Payment.amount), 0).label("paid"),
            )
            .filter(
                Payment.status == "received",
                Payment.is_deleted == False,  # noqa: E712
            )
            .group_by(Payment.order_id)
            .subquery()
        )

        order_balance = Order.gross_amount - func.coalesce(paid_sq.c.paid, 0)
        is_overdue = (order_balance > 0) & (Order.due_date.isnot(None)) & (Order.due_date < today)

        rows = (
            db.query(
                Order.customer_id.label("cid"),
                func.count(Order.id).label("orders_count"),
                func.coalesce(func.sum(Order.gross_amount), 0).label("total_billed"),
                func.coalesce(func.sum(order_balance), 0).label("balance_due"),
                func.coalesce(
                    func.sum(case((is_overdue, order_balance), else_=0)), 0
                ).label("overdue_balance"),
                func.max(
                    func.coalesce(Order.scheduled_datetime, Order.created_at)
                ).label("last_order_at"),
            )
            .outerjoin(paid_sq, paid_sq.c.order_id == Order.id)
            .filter(
                Order.customer_id.in_(customer_ids),
                Order.is_deleted == False,  # noqa: E712
            )
            .group_by(Order.customer_id)
            .all()
        )

        result: dict[UUID, dict] = {}
        for r in rows:
            result[r.cid] = {
                "orders_count": int(r.orders_count or 0),
                "total_billed": money(r.total_billed or 0),
                "balance_due": money(r.balance_due or 0),
                "overdue_balance": money(r.overdue_balance or 0),
                "last_order_at": r.last_order_at,
            }
        return result

    @staticmethod
    def get(db: Session, customer_id: UUID, allow_deleted: bool = True) -> Customer:
        q = db.query(Customer).filter(Customer.id == customer_id)
        if not allow_deleted:
            q = q.filter(Customer.is_deleted == False)  # noqa: E712
        c = q.first()
        if not c:
            raise NotFoundError("Customer not found", customer_id=str(customer_id))
        return c

    @staticmethod
    def create(db: Session, data: dict, actor: AdminUser, request: Request) -> Customer:
        c = Customer(**data)
        db.add(c)
        db.flush()
        AuditService.log(db, actor, "customers", str(c.id), "create", None, CustomersService._snapshot(c), request)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def update(db: Session, customer_id: UUID, data: dict, actor: AdminUser, request: Request) -> Customer:
        c = CustomersService.get(db, customer_id)
        before = CustomersService._snapshot(c)
        for k, v in data.items():
            setattr(c, k, v)
        AuditService.log(db, actor, "customers", str(c.id), "update", before, CustomersService._snapshot(c), request)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def soft_delete(db: Session, customer_id: UUID, actor: AdminUser, request: Request) -> None:
        c = CustomersService.get(db, customer_id)
        before = CustomersService._snapshot(c)
        c.is_deleted = True
        c.deleted_at = datetime.now(timezone.utc)
        c.deleted_by = actor.id
        AuditService.log(db, actor, "customers", str(c.id), "delete", before, CustomersService._snapshot(c), request)
        db.commit()

    @staticmethod
    def list_orders(db: Session, customer_id: UUID):
        CustomersService.get(db, customer_id)
        return (
            db.query(Order)
            .filter(Order.customer_id == customer_id, Order.is_deleted == False)  # noqa: E712
            .order_by(Order.created_at.desc())
            .all()
        )
