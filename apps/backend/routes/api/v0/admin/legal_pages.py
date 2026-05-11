# apps/backend/routes/api/v0/admin/legal_pages.py
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.LegalPagesController import LegalPagesController
from app.Models.admin import AdminUser
from app.Schemas.admin.legal_pages import (
    LegalPageAdminResponse,
    LegalPageCreate,
    LegalPageDraftSave,
    LegalPagePreview,
    LegalPagePublish,
    LegalPageRollback,
    LegalPageVersionResponse,
)
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/legal-pages", tags=["admin: legal pages"])


@router.get("", response_model=list[LegalPageAdminResponse])
async def list_pages(db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin), include_deleted: bool = Query(False)) -> list[LegalPageAdminResponse]:
    return LegalPagesController.list_pages(db, include_deleted)


@router.get("/{slug}", response_model=LegalPageAdminResponse)
async def get_page(slug: str, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPageAdminResponse:
    return LegalPagesController.get(db, slug)


@router.post("", response_model=LegalPageAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_page(request: Request, payload: LegalPageCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPageAdminResponse:
    return LegalPagesController.create(db, payload, actor, request)


@router.post("/{slug}/draft", response_model=LegalPageVersionResponse)
async def save_draft(request: Request, slug: str, payload: LegalPageDraftSave, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPageVersionResponse:
    return LegalPagesController.save_draft(db, slug, payload, actor, request)


@router.post("/{slug}/publish", response_model=LegalPageVersionResponse)
async def publish(request: Request, slug: str, payload: LegalPagePublish, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPageVersionResponse:
    return LegalPagesController.publish(db, slug, payload, actor, request)


@router.post("/{slug}/rollback", response_model=LegalPageVersionResponse)
async def rollback(request: Request, slug: str, payload: LegalPageRollback, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPageVersionResponse:
    return LegalPagesController.rollback(db, slug, payload, actor, request)


@router.get("/{slug}/versions", response_model=list[LegalPageVersionResponse])
async def list_versions(slug: str, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> list[LegalPageVersionResponse]:
    return LegalPagesController.list_versions(db, slug)


@router.get("/{slug}/preview", response_model=LegalPagePreview)
async def preview(slug: str, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> LegalPagePreview:
    return LegalPagesController.preview(db, slug)
