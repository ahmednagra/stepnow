# apps/backend/app/Http/Controllers/admin/CustomersController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Schemas.admin.customers_admin import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Services.CustomersService import CustomersService


class CustomersController:
    @staticmethod
    def list(
        db: Session, page: int, size: int, q: str | None, include_deleted: bool
    ) -> PaginatedResponse[CustomerResponse]:
        items, total = CustomersService.customers_list(db, page, size, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0

        # One grouped query for the loaded page → per-customer rollups (no N+1).
        aggregates = CustomersService.aggregates_for(db, [c.id for c in items])

        rows: list[CustomerResponse] = []
        for c in items:
            base = CustomerResponse.model_validate(c).model_dump()
            agg = aggregates.get(c.id)
            if agg:
                base.update(
                    orders_count=agg["orders_count"],
                    total_billed=agg["total_billed"],
                    balance_due=agg["balance_due"],
                    overdue_balance=agg["overdue_balance"],
                    last_order_at=agg["last_order_at"],
                )
            rows.append(CustomerResponse(**base))

        return PaginatedResponse[CustomerResponse](
            items=rows,
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, customer_id: UUID) -> CustomerResponse:
        return CustomerResponse.model_validate(CustomersService.get(db, customer_id))

    @staticmethod
    def create(
        db: Session, payload: CustomerCreate, actor: AdminUser, request: Request
    ) -> CustomerResponse:
        return CustomerResponse.model_validate(
            CustomersService.create(db, payload.model_dump(), actor, request)
        )

    @staticmethod
    def update(
        db: Session,
        customer_id: UUID,
        payload: CustomerUpdate,
        actor: AdminUser,
        request: Request,
    ) -> CustomerResponse:
        return CustomerResponse.model_validate(
            CustomersService.update(
                db, customer_id, payload.model_dump(exclude_unset=True), actor, request
            )
        )

    @staticmethod
    def delete(
        db: Session, customer_id: UUID, actor: AdminUser, request: Request
    ) -> None:
        CustomersService.soft_delete(db, customer_id, actor, request)

    @staticmethod
    def list_orders(db: Session, customer_id: UUID):
        return [
            CourierOrderResponse.model_validate(o)
            for o in CustomersService.list_orders(db, customer_id)
        ]
