# apps/backend/config/settings.py
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")
    APP_NAME: str = "StepNow Backend"
    ENVIRONMENT: str = Field("development")
    DEBUG: bool = False
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRES_DAYS: int = 7
    EMAIL_PROVIDER: str = "postmark"
    EMAIL_API_KEY: str
    EMAIL_FROM_ADDRESS: str = "info@step-now.de"
    EMAIL_FROM_NAME: str = "StepNow Rides"
    EMAIL_ADMIN_NOTIFY: str = "info@step-now.de"
    CORS_ALLOWED_ORIGINS: list[str] = ["https://step-now.de"]
    BOOKING_RATE_LIMIT: str = "5/hour"
    CONTACT_RATE_LIMIT: str = "3/hour"
    BACKUP_S3_ENDPOINT: str | None = None
    BACKUP_S3_BUCKET: str | None = None
    BACKUP_S3_ACCESS_KEY: str | None = None
    BACKUP_S3_SECRET_KEY: str | None = None
    BACKUP_RETENTION_DAYS: int = 30
    LOG_LEVEL: str = "INFO"


settings = Settings()
