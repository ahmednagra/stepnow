# apps/backend/routes/api/v0/admin/pricing.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.PricingController import PricingController
from app.Models.admin import AdminUser
from app.Schemas.admin.pricing import (
    PricingCategoryAdminResponse,
    PricingCategoryCreate,
    PricingCategoryUpdate,
    PricingItemAdminResponse,
    PricingItemCreate,
    PricingItemUpdate,
)
from app.Utils.Helpers import get_current_admin

router = APIRouter(tags=["admin: pricing"])


# Category endpoints nested under services
@router.get("/admin/services/{service_id}/pricing-categories", response_model=list[PricingCategoryAdminResponse])
async def list_categories(
    service_id: UUID,
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    include_deleted: bool = Query(False),
) -> list[PricingCategoryAdminResponse]:
    return PricingController.list_categories(db, service_id, include_deleted)


@router.post("/admin/services/{service_id}/pricing-categories", response_model=PricingCategoryAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_category(request: Request, service_id: UUID, payload: PricingCategoryCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingCategoryAdminResponse:
    return PricingController.create_category(db, service_id, payload, actor, request)


@router.get("/admin/pricing-categories/{category_id}", response_model=PricingCategoryAdminResponse)
async def get_category(category_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingCategoryAdminResponse:
    return PricingController.get_category(db, category_id)


@router.patch("/admin/pricing-categories/{category_id}", response_model=PricingCategoryAdminResponse)
async def update_category(request: Request, category_id: UUID, payload: PricingCategoryUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingCategoryAdminResponse:
    return PricingController.update_category(db, category_id, payload, actor, request)


@router.delete("/admin/pricing-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(request: Request, category_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    PricingController.delete_category(db, category_id, actor, request)


@router.post("/admin/pricing-categories/{category_id}/restore", response_model=PricingCategoryAdminResponse)
async def restore_category(request: Request, category_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingCategoryAdminResponse:
    return PricingController.restore_category(db, category_id, actor, request)


# Item endpoints nested under pricing-categories
@router.get("/admin/pricing-categories/{category_id}/items", response_model=list[PricingItemAdminResponse])
async def list_items(category_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin), include_deleted: bool = Query(False)) -> list[PricingItemAdminResponse]:
    return PricingController.list_items(db, category_id, include_deleted)


@router.post("/admin/pricing-categories/{category_id}/items", response_model=PricingItemAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_item(request: Request, category_id: UUID, payload: PricingItemCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingItemAdminResponse:
    return PricingController.create_item(db, category_id, payload, actor, request)


@router.get("/admin/pricing-items/{item_id}", response_model=PricingItemAdminResponse)
async def get_item(item_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingItemAdminResponse:
    return PricingController.get_item(db, item_id)


@router.patch("/admin/pricing-items/{item_id}", response_model=PricingItemAdminResponse)
async def update_item(request: Request, item_id: UUID, payload: PricingItemUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingItemAdminResponse:
    return PricingController.update_item(db, item_id, payload, actor, request)


@router.delete("/admin/pricing-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(request: Request, item_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    PricingController.delete_item(db, item_id, actor, request)


@router.post("/admin/pricing-items/{item_id}/restore", response_model=PricingItemAdminResponse)
async def restore_item(request: Request, item_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> PricingItemAdminResponse:
    return PricingController.restore_item(db, item_id, actor, request)
