# apps/backend/app/Http/Controllers/AuthController.py
from fastapi import Request
from sqlalchemy.orm import Session
from app.Schemas.auth import AdminProfile, LoginRequest, LogoutRequest, RefreshRequest, TokenResponse
from app.Schemas.common import OkResponse
from app.Services.AuthService import AuthService
from app.Models.admin import AdminUser


class AuthController:

    @staticmethod
    def login(db: Session, payload: LoginRequest, request: Request) -> TokenResponse:
        _, tokens = AuthService.login(db, payload.email, payload.password, request)
        return TokenResponse(access_token=tokens["access_token"], refresh_token=tokens["refresh_token"], token_type="bearer", expires_in=tokens["expires_in"])

    @staticmethod
    def refresh(db: Session, payload: RefreshRequest, request: Request) -> TokenResponse:
        result = AuthService.refresh(db, payload.refresh_token, request)
        return TokenResponse(**result)

    @staticmethod
    def logout(db: Session, payload: LogoutRequest, actor: AdminUser, request: Request) -> OkResponse:
        AuthService.logout(db, payload.refresh_token, actor, request)
        return OkResponse()

    @staticmethod
    def me(actor: AdminUser) -> AdminProfile:
        return AdminProfile.model_validate(actor)
