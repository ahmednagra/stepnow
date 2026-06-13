# apps/backend/config/settings.py
# Pydantic Settings: loads .env via os.getenv with explicit defaults and exposes
# typed config. Email is SMTP-based (Hostinger) with two mailboxes — rides and
# movers — selectable through the `mailbox()` helper. Falls back gracefully:
# a mailbox with no dedicated credentials uses the shared/default identity.

import os
from dataclasses import dataclass
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env so os.getenv resolves at import time regardless of cwd.
load_dotenv()


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


@dataclass(frozen=True)
class MailboxConfig:
    """Resolved SMTP identity for a single sending mailbox."""
    host: str | None
    port: int
    use_ssl: bool          # True => implicit TLS (465); False => STARTTLS (587)
    timeout: int
    user: str | None
    password: str | None
    from_email: str
    from_name: str
    reply_to: str | None

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.user and self.password)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # ── Application ──
    APP_NAME: str = os.getenv("APP_NAME", "StepNow Backend")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = _as_bool(os.getenv("DEBUG"), False)

    # ── Seed-on-boot (dev only; hard-refused in production) ──
    AUTO_SEED_ON_STARTUP: bool = _as_bool(os.getenv("AUTO_SEED_ON_STARTUP"), False)
    SEED_ADMIN_EMAIL: str = os.getenv("SEED_ADMIN_EMAIL", "info@step-now.de")
    SEED_ADMIN_PASSWORD: str = os.getenv("SEED_ADMIN_PASSWORD", "")
    SEED_ADMIN_ALLOW_WEAK_PASSWORD: bool = _as_bool(os.getenv("SEED_ADMIN_ALLOW_WEAK_PASSWORD"), False)

    # ── Database ──
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # ── JWT ──
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
    JWT_REFRESH_TOKEN_EXPIRES_DAYS: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))

    # ── CORS ──
    # JSON-list string in .env, e.g. ["http://localhost:3000","https://step-now.de"]
    CORS_ALLOWED_ORIGINS: list[str] = ["https://step-now.de"]

    # ── Public site (Next.js frontend) base URL ──
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://step-now.de")

    # ── Rate limits ──
    BOOKING_RATE_LIMIT: str = os.getenv("BOOKING_RATE_LIMIT", "5/hour")
    CONTACT_RATE_LIMIT: str = os.getenv("CONTACT_RATE_LIMIT", "3/hour")

    # ── Backups (S3-compatible) ──
    BACKUP_S3_ENDPOINT: str | None = os.getenv("BACKUP_S3_ENDPOINT") or None
    BACKUP_S3_BUCKET: str | None = os.getenv("BACKUP_S3_BUCKET") or None
    BACKUP_S3_ACCESS_KEY: str | None = os.getenv("BACKUP_S3_ACCESS_KEY") or None
    BACKUP_S3_SECRET_KEY: str | None = os.getenv("BACKUP_S3_SECRET_KEY") or None
    BACKUP_RETENTION_DAYS: int = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))

    # ════════════════════════════════════════════════════════════════
    # EMAIL
    # ════════════════════════════════════════════════════════════════
    # Provider switch: "smtp" => real send via SMTP_* below; "log" => log-only.
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "log")
    # Legacy API-key placeholder (Postmark/etc.); unused while provider is smtp.
    EMAIL_API_KEY: str = os.getenv("EMAIL_API_KEY", "")

    # Shared SMTP transport (both mailboxes share host/port/security).
    SMTP_HOST: str | None = os.getenv("SMTP_HOST") or None
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_SSL: bool = _as_bool(os.getenv("SMTP_SSL"), True)
    SMTP_TIMEOUT_SECONDS: int = int(os.getenv("SMTP_TIMEOUT_SECONDS", "30"))

    # Default sender identity + admin notify target + global reply-to.
    EMAIL_FROM_ADDRESS: str = os.getenv("EMAIL_FROM_ADDRESS", "info@step-now.de")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "StepNow")
    EMAIL_ADMIN_NOTIFY: str = os.getenv("EMAIL_ADMIN_NOTIFY", "info@step-now.de")
    EMAIL_REPLY_TO: str | None = os.getenv("EMAIL_REPLY_TO") or None

    # ── Mailbox: RIDES (taxi / passenger bookings) ──
    SMTP_RIDES_USER: str | None = os.getenv("SMTP_RIDES_USER") or None
    SMTP_RIDES_PASSWORD: str | None = os.getenv("SMTP_RIDES_PASSWORD") or None
    SMTP_RIDES_FROM_EMAIL: str | None = os.getenv("SMTP_RIDES_FROM_EMAIL") or None
    SMTP_RIDES_FROM_NAME: str | None = os.getenv("SMTP_RIDES_FROM_NAME") or None

    # ── Mailbox: MOVERS (courier / transport orders) ──
    SMTP_MOVERS_USER: str | None = os.getenv("SMTP_MOVERS_USER") or None
    SMTP_MOVERS_PASSWORD: str | None = os.getenv("SMTP_MOVERS_PASSWORD") or None
    SMTP_MOVERS_FROM_EMAIL: str | None = os.getenv("SMTP_MOVERS_FROM_EMAIL") or None
    SMTP_MOVERS_FROM_NAME: str | None = os.getenv("SMTP_MOVERS_FROM_NAME") or None

    # ── Mailbox: ACCOUNTS (all customer invoices) ──
    SMTP_ACCOUNTS_USER: str | None = os.getenv("SMTP_ACCOUNTS_USER") or None
    SMTP_ACCOUNTS_PASSWORD: str | None = os.getenv("SMTP_ACCOUNTS_PASSWORD") or None
    SMTP_ACCOUNTS_FROM_EMAIL: str | None = os.getenv("SMTP_ACCOUNTS_FROM_EMAIL") or None
    SMTP_ACCOUNTS_FROM_NAME: str | None = os.getenv("SMTP_ACCOUNTS_FROM_NAME") or None

    # ── Mailbox: NOREPLY (system / automated) ──
    SMTP_NOREPLY_USER: str | None = os.getenv("SMTP_NOREPLY_USER") or None
    SMTP_NOREPLY_PASSWORD: str | None = os.getenv("SMTP_NOREPLY_PASSWORD") or None
    SMTP_NOREPLY_FROM_EMAIL: str | None = os.getenv("SMTP_NOREPLY_FROM_EMAIL") or None
    SMTP_NOREPLY_FROM_NAME: str | None = os.getenv("SMTP_NOREPLY_FROM_NAME") or None

    # ── Module → mailbox routing ──
    MAILBOX_BOOKING: str = os.getenv("MAILBOX_BOOKING", "rides")
    MAILBOX_CONTACT: str = os.getenv("MAILBOX_CONTACT", "accounts")
    MAILBOX_COURIER_DRIVER: str = os.getenv("MAILBOX_COURIER_DRIVER", "movers")
    MAILBOX_COURIER_INVOICE: str = os.getenv("MAILBOX_COURIER_INVOICE", "accounts")

    # ════════════════════════════════════════════════════════════════
    # Company / invoice header
    # ════════════════════════════════════════════════════════════════
    COMPANY_NAME: str = os.getenv("COMPANY_NAME", "StepNow Rides & Movers")
    COMPANY_OWNER: str = os.getenv("COMPANY_OWNER", "Naeem Ahmad e.K.")
    COMPANY_STREET: str = os.getenv("COMPANY_STREET", "")
    COMPANY_CITY: str = os.getenv("COMPANY_CITY", "")
    COMPANY_REGION: str = os.getenv("COMPANY_REGION", "")
    COMPANY_PHONE: str = os.getenv("COMPANY_PHONE", "")
    COMPANY_EMAIL: str = os.getenv("COMPANY_EMAIL", "info@step-now.de")
    COMPANY_TAX_NO: str = os.getenv("COMPANY_TAX_NO", "")
    COMPANY_BANK: str = os.getenv("COMPANY_BANK", "")

    # ── Uploads ──
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    UPLOAD_PUBLIC_URL_PREFIX: str = os.getenv("UPLOAD_PUBLIC_URL_PREFIX", "/uploads")
    UPLOAD_MAX_SIZE_BYTES: int = int(os.getenv("UPLOAD_MAX_SIZE_BYTES", str(10 * 1024 * 1024)))
    UPLOAD_MIN_DIMENSION: int = int(os.getenv("UPLOAD_MIN_DIMENSION", "100"))
    UPLOAD_MAX_DIMENSION: int = int(os.getenv("UPLOAD_MAX_DIMENSION", "8000"))

    # ── Logging ──
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ────────────────────────────────────────────────────────────────
    # Email helpers
    # ────────────────────────────────────────────────────────────────
    @property
    def email_enabled(self) -> bool:
        """True when the SMTP provider is selected and the transport host is set."""
        return self.EMAIL_PROVIDER.strip().lower() == "smtp" and bool(self.SMTP_HOST)

    def mailbox(self, kind: str = "rides") -> MailboxConfig:
        """Resolve SMTP identity for a sending mailbox.

        kind: "rides" (default), "movers", "accounts", or "noreply". Unknown
        kinds fall back to "rides". Per-mailbox credentials override the shared
        defaults; anything missing falls back to EMAIL_FROM_ADDRESS/NAME.
        """
        k = (kind or "rides").strip().lower()
        if k == "movers":
            user = self.SMTP_MOVERS_USER
            password = self.SMTP_MOVERS_PASSWORD
            from_email = self.SMTP_MOVERS_FROM_EMAIL
            from_name = self.SMTP_MOVERS_FROM_NAME
        elif k == "accounts":
            user = self.SMTP_ACCOUNTS_USER
            password = self.SMTP_ACCOUNTS_PASSWORD
            from_email = self.SMTP_ACCOUNTS_FROM_EMAIL
            from_name = self.SMTP_ACCOUNTS_FROM_NAME
        elif k == "noreply":
            user = self.SMTP_NOREPLY_USER
            password = self.SMTP_NOREPLY_PASSWORD
            from_email = self.SMTP_NOREPLY_FROM_EMAIL
            from_name = self.SMTP_NOREPLY_FROM_NAME
        else:  # "rides" and any unknown kind
            user = self.SMTP_RIDES_USER
            password = self.SMTP_RIDES_PASSWORD
            from_email = self.SMTP_RIDES_FROM_EMAIL
            from_name = self.SMTP_RIDES_FROM_NAME

        return MailboxConfig(
            host=self.SMTP_HOST,
            port=self.SMTP_PORT,
            use_ssl=self.SMTP_SSL,
            timeout=self.SMTP_TIMEOUT_SECONDS,
            user=user,
            password=password,
            from_email=from_email or user or self.EMAIL_FROM_ADDRESS,
            from_name=from_name or self.EMAIL_FROM_NAME,
            reply_to=self.EMAIL_REPLY_TO,
        )

    def module_mailbox(self, module: str) -> MailboxConfig:
        """Resolve the mailbox a given module sends from, per the .env routing map.

        module: one of "booking", "contact", "courier_driver", "courier_invoice".
        Returns the configured MailboxConfig. Unknown modules default to "rides".
        Edit MAILBOX_* in .env to re-route a module without touching code.
        """
        routing = {
            "booking": self.MAILBOX_BOOKING,
            "contact": self.MAILBOX_CONTACT,
            "courier_driver": self.MAILBOX_COURIER_DRIVER,
            "courier_invoice": self.MAILBOX_COURIER_INVOICE,
        }
        kind = routing.get((module or "").strip().lower(), "rides")
        return self.mailbox(kind)


settings = Settings()
