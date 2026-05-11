# apps/backend/routes/api/v0/admin/settings.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.SettingsController import SettingsController
from app.Models.admin import AdminUser
from app.Schemas.admin.settings import SettingsAdminResponse, SettingsUpdate
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/settings", tags=["admin: settings"])


@router.get("", response_model=SettingsAdminResponse)
async def get_settings(db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> SettingsAdminResponse:
    return SettingsController.get(db)


@router.patch("", response_model=SettingsAdminResponse)
async def update_settings(request: Request, payload: SettingsUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> SettingsAdminResponse:
    return SettingsController.update(db, payload, actor, request)
