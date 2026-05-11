# apps/backend/app/Core/Exceptions.py
from typing import Any


class AppError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, **extra: Any):
        super().__init__(message)
        self.message = message
        self.extra = extra


class DomainError(AppError):
    status_code = 400
    error_code = "DOMAIN_ERROR"


class AuthError(AppError):
    status_code = 401
    error_code = "AUTH_FAILED"


class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"


class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"


class RateLimitError(AppError):
    status_code = 429
    error_code = "RATE_LIMITED"


class RequiredFieldError(DomainError):
    # Raised when an admin attempts to clear a field listed in ProtectedFields.
    error_code = "REQUIRED_FIELD"
