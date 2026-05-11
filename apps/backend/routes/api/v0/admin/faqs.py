# apps/backend/routes/api/v0/admin/faqs.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.FaqsController import FaqsController
from app.Models.admin import AdminUser
from app.Schemas.admin.faqs import FaqAdminResponse, FaqCreate, FaqUpdate
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/faqs", tags=["admin: faqs"])


@router.get("", response_model=PaginatedResponse[FaqAdminResponse])
async def list_faqs(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    category: str | None = Query(None, max_length=50),
    include_inactive: bool = Query(True),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[FaqAdminResponse]:
    return FaqsController.list_faqs(db, page, size, q, category, include_inactive, include_deleted)


@router.get("/{faq_id}", response_model=FaqAdminResponse)
async def get_faq(faq_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FaqAdminResponse:
    return FaqsController.get(db, faq_id)


@router.post("", response_model=FaqAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(request: Request, payload: FaqCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FaqAdminResponse:
    return FaqsController.create(db, payload, actor, request)


@router.patch("/{faq_id}", response_model=FaqAdminResponse)
async def update_faq(request: Request, faq_id: UUID, payload: FaqUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FaqAdminResponse:
    return FaqsController.update(db, faq_id, payload, actor, request)


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(request: Request, faq_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    FaqsController.delete(db, faq_id, actor, request)


@router.post("/{faq_id}/restore", response_model=FaqAdminResponse)
async def restore_faq(request: Request, faq_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> FaqAdminResponse:
    return FaqsController.restore(db, faq_id, actor, request)
