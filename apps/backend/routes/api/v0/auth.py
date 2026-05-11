# apps/backend/routes/api/v0/auth.py

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from config.database import get_db
from app.Http.Controllers.AuthController import AuthController
from app.Models.admin import AdminUser
from app.Schemas.auth import AdminProfile, LoginRequest, LogoutRequest, RefreshRequest, TokenResponse
from app.Schemas.common import OkResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthController.login(db, payload, request)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthController.refresh(db, payload, request)


@router.post("/logout", response_model=OkResponse)
async def logout(
    payload: LogoutRequest,
    request: Request,
    actor: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> OkResponse:
    return AuthController.logout(db, payload, actor, request)


@router.get("/me", response_model=AdminProfile)
async def me(actor: AdminUser = Depends(get_current_admin)) -> AdminProfile:
    return AuthController.me(actor)