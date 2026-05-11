# apps/backend/app/Http/Controllers/admin/SettingsController.py
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.settings import SettingsAdminResponse, SettingsUpdate
from app.Services.SettingsService import SettingsService


class SettingsController:

    @staticmethod
    def get(db: Session) -> SettingsAdminResponse:
        s = SettingsService.get_required(db)
        return SettingsAdminResponse.model_validate(s)

    @staticmethod
    def update(db: Session, payload: SettingsUpdate, actor: AdminUser, request: Request) -> SettingsAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        s = SettingsService.update(db, data, actor, request)
        return SettingsAdminResponse.model_validate(s)
