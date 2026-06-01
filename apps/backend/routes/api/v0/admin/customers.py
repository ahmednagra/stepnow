# apps/backend/routes/api/v0/admin/customers.py
# Customer admin endpoints (incl. the repeat-customer search via ?q=).

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.CustomersController import CustomersController
from app.Models.admin import AdminUser
from app.Schemas.common import PaginatedResponse
from app.Schemas.admin.customers_admin import CustomerCreate, CustomerResponse, CustomerUpdate
from app.Schemas.admin.courier_admin import CourierOrderResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: customers"])


@router.get("/admin/customers", response_model=PaginatedResponse[CustomerResponse])
async def list_customers(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[CustomerResponse]:
    return CustomersController.list(db, page, size, q, include_deleted)


@router.post("/admin/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(request: Request, payload: CustomerCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CustomerResponse:
    return CustomersController.create(db, payload, actor, request)


@router.get("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CustomerResponse:
    return CustomersController.get(db, customer_id)


@router.patch("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(request: Request, customer_id: UUID, payload: CustomerUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> CustomerResponse:
    return CustomersController.update(db, customer_id, payload, actor, request)


@router.delete("/admin/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(request: Request, customer_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    CustomersController.delete(db, customer_id, actor, request)


@router.get("/admin/customers/{customer_id}/orders", response_model=list[CourierOrderResponse])
async def customer_orders(customer_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> list[CourierOrderResponse]:
    return CustomersController.list_orders(db, customer_id)
