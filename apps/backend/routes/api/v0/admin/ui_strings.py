# apps/backend/routes/api/v0/admin/ui_strings.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.UiStringsController import UiStringsController
from app.Models.admin import AdminUser
from app.Schemas.admin.ui_strings import UiStringAdminResponse, UiStringCreate, UiStringUpdate
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/ui-strings", tags=["admin: ui strings"])


@router.get("", response_model=PaginatedResponse[UiStringAdminResponse])
async def list_strings(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    namespace: str | None = Query(None, max_length=100),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[UiStringAdminResponse]:
    return UiStringsController.list_strings(db, page, size, q, namespace, include_deleted)


@router.get("/{string_id}", response_model=UiStringAdminResponse)
async def get_string(string_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UiStringAdminResponse:
    return UiStringsController.get(db, string_id)


@router.post("", response_model=UiStringAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_string(request: Request, payload: UiStringCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UiStringAdminResponse:
    return UiStringsController.create(db, payload, actor, request)


@router.patch("/{string_id}", response_model=UiStringAdminResponse)
async def update_string(request: Request, string_id: UUID, payload: UiStringUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UiStringAdminResponse:
    return UiStringsController.update(db, string_id, payload, actor, request)


@router.delete("/{string_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_string(request: Request, string_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    UiStringsController.delete(db, string_id, actor, request)


@router.post("/{string_id}/restore", response_model=UiStringAdminResponse)
async def restore_string(request: Request, string_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> UiStringAdminResponse:
    return UiStringsController.restore(db, string_id, actor, request)
