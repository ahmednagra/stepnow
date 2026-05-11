# apps/backend/app/Services/AuthService.py
from datetime import datetime, timedelta, timezone
from fastapi import Request
from sqlalchemy.orm import Session
from config.settings import settings
from app.Core.Exceptions import AuthError
from app.Models.admin import AdminUser, RefreshToken
from app.Services.AuditService import AuditService
from app.Utils.Helpers import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)


class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str, request: Request | None = None) -> tuple[AdminUser, dict]:
        user = db.query(AdminUser).filter(AdminUser.email == email, AdminUser.is_deleted == False).first()
        if not user or not verify_password(password, user.password_hash):
            AuditService.log(db, None, "admin_users", email, "login_failed", None, {"email": email, "reason": "invalid_credentials"}, request)
            db.commit()
            raise AuthError("Invalid credentials")
        if not user.active:
            AuditService.log(db, user, "admin_users", str(user.id), "login_failed", None, {"reason": "inactive"}, request)
            db.commit()
            raise AuthError("Account inactive")
        user.last_login_at = datetime.now(timezone.utc)
        tokens = AuthService._issue_tokens(db, user, request)
        AuditService.log(db, user, "admin_users", str(user.id), "login_success", None, {"email": user.email}, request)
        db.commit()
        return user, tokens

    @staticmethod
    def refresh(db: Session, raw_refresh_token: str, request: Request | None = None) -> dict:
        token_hash = hash_refresh_token(raw_refresh_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        now = datetime.now(timezone.utc)
        if not stored or stored.revoked_at is not None or stored.expires_at < now:
            raise AuthError("Invalid or expired refresh token")
        user = db.query(AdminUser).filter(AdminUser.id == stored.user_id, AdminUser.is_deleted == False, AdminUser.active == True).first()
        if not user:
            raise AuthError("User not found or inactive")
        stored.revoked_at = now
        tokens = AuthService._issue_tokens(db, user, request)
        AuditService.log(db, user, "refresh_tokens", str(stored.id), "rotate", None, {"new_token_id": tokens["refresh_token_id"]}, request)
        db.commit()
        return {"access_token": tokens["access_token"], "refresh_token": tokens["refresh_token"], "token_type": "bearer", "expires_in": tokens["expires_in"]}

    @staticmethod
    def logout(db: Session, raw_refresh_token: str, actor: AdminUser, request: Request | None = None) -> None:
        token_hash = hash_refresh_token(raw_refresh_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash, RefreshToken.user_id == actor.id).first()
        if not stored or stored.revoked_at is not None:
            return
        stored.revoked_at = datetime.now(timezone.utc)
        AuditService.log(db, actor, "refresh_tokens", str(stored.id), "revoke", None, {"reason": "logout"}, request)
        db.commit()

    @staticmethod
    def _issue_tokens(db: Session, user: AdminUser, request: Request | None) -> dict:
        access_token, expires_in = create_access_token(str(user.id))
        raw_refresh = generate_refresh_token()
        refresh = RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRES_DAYS),
            user_agent=request.headers.get("user-agent") if request else None,
            ip_address=request.client.host if request and request.client else None,
        )
        db.add(refresh)
        db.flush()
        return {"access_token": access_token, "refresh_token": raw_refresh, "expires_in": expires_in, "refresh_token_id": str(refresh.id)}
