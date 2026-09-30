# apps/backend/app/Http/Controllers/admin/CustomersController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.customers_admin import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Services.CustomersService import CustomersService


class CustomersController:
    @staticmethod
    def _enrich(c, aggregates: dict) -> CustomerResponse:
        return CustomerResponse(**{**CustomerResponse.model_validate(c).model_dump(), **aggregates.get(c.id, {})})

    @staticmethod
    def list(
        db: Session, page: int, size: int, q: str | None, include_deleted: bool
    ) -> PaginatedResponse[CustomerResponse]:
        items, total = CustomersService.customers_list(db, page, size, q, include_deleted)
        # One grouped query for the loaded page → per-customer rollups (no N+1).
        aggregates = CustomersService.aggregates_for(db, [c.id for c in items])
        return PaginatedResponse[CustomerResponse].build([CustomersController._enrich(c, aggregates) for c in items], page, size, total)

    @staticmethod
    def get(db: Session, customer_id: UUID) -> CustomerResponse:
        # The detail page shows lifetime totals from these SQL rollups, not by summing its order page.
        c = CustomersService.get(db, customer_id)
        return CustomersController._enrich(c, CustomersService.aggregates_for(db, [c.id]))

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
        c = CustomersService.update(db, customer_id, payload.model_dump(exclude_unset=True), actor, request)
        return CustomersController._enrich(c, CustomersService.aggregates_for(db, [c.id]))

    @staticmethod
    def delete(
        db: Session, customer_id: UUID, actor: AdminUser, request: Request
    ) -> None:
        CustomersService.soft_delete(db, customer_id, actor, request)

    @staticmethod
    def list_orders(db: Session, customer_id: UUID, page: int, size: int) -> PaginatedResponse[CourierOrderResponse]:
        items, total = CustomersService.list_orders(db, customer_id, page, size)
        return PaginatedResponse[CourierOrderResponse].build([CourierOrderResponse.model_validate(o) for o in items], page, size, total)
