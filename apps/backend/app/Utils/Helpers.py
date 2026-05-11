# apps/backend/app/Utils/Helpers.py
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID
import bcrypt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from config.database import get_db
from config.settings import settings
from app.Core.Exceptions import AuthError
from app.Models.admin import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v0/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(subject: str) -> tuple[str, int]:
    expires_minutes = settings.JWT_ACCESS_TOKEN_EXPIRES_MINUTES
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expire, "iat": now, "type": "access", "jti": secrets.token_urlsafe(16)}
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_minutes * 60


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise AuthError("Invalid or expired token")
    if payload.get("type") != "access":
        raise AuthError("Wrong token type")
    sub = payload.get("sub")
    if not sub:
        raise AuthError("Token missing subject")
    return sub


async def get_current_admin(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> AdminUser:
    if not token:
        raise AuthError("Not authenticated")
    user_id = decode_access_token(token)
    try:
        user_uuid = UUID(user_id)
    except (ValueError, TypeError):
        raise AuthError("Invalid token subject")
    user = db.query(AdminUser).filter(AdminUser.id == user_uuid, AdminUser.is_deleted == False, AdminUser.active == True).first()
    if not user:
        raise AuthError("User not found or inactive")
    return user
