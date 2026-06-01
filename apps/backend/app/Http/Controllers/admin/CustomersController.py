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
        items, total = CustomersService.list(db, page, size, q, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[CustomerResponse](
            items=[CustomerResponse.model_validate(c) for c in items],
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
