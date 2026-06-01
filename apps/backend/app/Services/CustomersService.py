# apps/backend/app/Services/CustomersService.py
# Business logic for customers + the repeat-customer search (name OR phone).

from datetime import datetime, timezone
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.admin import AdminUser
from app.Models.customers import Customer
from app.Models.orders import Order
from app.Services.AuditService import AuditService


class CustomersService:

    @staticmethod
    def _snapshot(c: Customer) -> dict:
        return {"first_name": c.first_name, "last_name": c.last_name, "email": c.email, "phone": c.phone}

    @staticmethod
    def list(db: Session, page: int, size: int, q: str | None, include_deleted: bool):
        query = db.query(Customer)
        if not include_deleted:
            query = query.filter(Customer.is_deleted == False)  # noqa: E712
        if q:
            like = f"%{q.strip()}%"
            digits = "".join(ch for ch in q if ch.isdigit())
            conds = [
                Customer.first_name.ilike(like),
                Customer.last_name.ilike(like),
                Customer.company_name.ilike(like),
            ]
            if digits:
                conds.append(Customer.phone.ilike(f"%{digits}%"))
            from sqlalchemy import or_
            query = query.filter(or_(*conds))
        total = query.count()
        items = query.order_by(Customer.last_name.asc(), Customer.first_name.asc()).offset((page - 1) * size).limit(size).all()
        return items, total

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
