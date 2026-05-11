# StepNow — Backend Architecture

> **Audience.** Engineers writing or reviewing code in the StepNow backend repository.
> **Scope.** The Python/FastAPI backend only. Frontend conventions live in `docs/architecture/frontend.md`.
> **Status.** Target architecture for the rebuild. As code lands, this document is updated to reflect the codebase. When code and document disagree, code wins and the document is updated.
> **Lineage.** This architecture inherits its disciplines from the Echooo backend's `ARCHITECTURE.md`. Where StepNow deviates, the deviation is intentional and explained.

---

## 1. What StepNow Is

StepNow is a **single-tenant marketing and booking website** for a regional German Mietwagen operator. The backend serves:

- A **public-facing API** for the Next.js frontend — content reads (services, FAQ, pricing, settings, UI strings, legal pages) and form submissions (bookings, contact)
- An **admin API** for Naeem (the single business operator) to manage every piece of editable content
- **Email dispatch** for booking confirmations, contact replies, and admin notifications

No multi-tenancy. No agency tiers. No subscription billing. No quota. No realtime layer. No external integrations beyond email.

### 1.1 Content Authority Model

StepNow operates under a **single-authority content model**: Naeem, as the business owner, has authority to edit any content on the site, including legal pages. This is an explicit business decision made in the design phase, with documented risks accepted by the project owner.

**Non-negotiable invariants:**

- Every editable content surface lives in the database — UI strings, business content, and legal pages
- Secrets and infrastructure values never leave `.env` and are accessed exclusively via `config/settings.py`
- Naeem's admin authority is unconstrained by UI, but is protected by **operational safeguards** (§15) that prevent destructive mistakes without limiting his authority
- Public endpoints accept user input but never expose admin operations or unfiltered DB data
- Form submissions are rate-limited, validated, and DSGVO-compliant
- No response mixes German and English content within a single payload

### 1.2 Risk Acknowledgement (DO NOT REMOVE)

This document explicitly records that **legal page content (Impressum, Datenschutzerklärung, AGB) is admin-editable.** Under German law, errors in these pages can result in:

- Abmahnungen under UWG, typical cost €500–2000 per incident
- DSGVO violations from €5,000+ for missing or incorrect data protection disclosures
- Misleading advertising claims if business facts are altered incorrectly

The project owner accepted these risks in exchange for editorial control. The safeguards in §15 mitigate but do not eliminate them. **Anyone removing or weakening the safeguards must explicitly re-acknowledge the risk in writing.**

---

## 2. Tech Stack

| Layer | Choice | Same as Echooo? |
|---|---|---|
| Language | Python 3.12+ (`python:3.12-slim-bookworm`) | ✓ |
| Framework | FastAPI (Uvicorn ASGI) | ✓ |
| ORM | SQLAlchemy with **synchronous** `Session` | ✓ |
| Database | PostgreSQL | ✓ |
| Validation | Pydantic v2 with `pydantic-settings` | ✓ |
| Migrations | Alembic | ✓ |
| Email | In-house facade with one provider (Postmark or Resend) | Simplified |
| Auth | JWT (`python-jose`, HS256) + bcrypt password hashing | ✓ |
| HTTP client | `httpx.AsyncClient` — `requests` is forbidden | ✓ |
| Background work | FastAPI `BackgroundTasks` only at V1 | Simplified |
| Rate limiting | `slowapi` (in-memory at V1) | New |
| Realtime | **None** | Omitted |
| Storage | Local filesystem for V1 (vehicle images) | Simplified |
| Backups | `pg_dump` daily to S3 + Hetzner snapshot daily | New |
| Frontend communication | Pure REST/JSON. CORS for `step-now.de` only. | New approach |

---

## 3. Deployment Topology

```
┌──────────────────────────────────────────────────────────┐
│ Hetzner Cloud (Germany)                                  │
│                                                          │
│  ┌─────────────────┐         ┌────────────────────┐    │
│  │ Next.js (3000)  │ ──REST→ │ FastAPI (8000)     │    │
│  │ SSR + static    │         │ uvicorn workers    │    │
│  └─────────────────┘         └─────────┬──────────┘    │
│        ↑                               ↓                │
│        │                     ┌─────────────────────┐    │
│        │                     │ PostgreSQL (5432)   │    │
│   ┌────┴──────┐              └──────────┬──────────┘    │
│   │  nginx    │                         │               │
│   │ TLS, gzip │                         ↓               │
│   │ reverse   │              ┌─────────────────────┐    │
│   │ proxy     │              │ Daily pg_dump → S3  │    │
│   └────┬──────┘              │ 30-day retention    │    │
│        ↑                     └─────────────────────┘    │
│        │                                                 │
│        │                     ┌─────────────────────┐    │
│        │                     │ Postmark / Resend   │    │
│        │                     └─────────────────────┘    │
└────────┼─────────────────────────────────────────────────┘
         │ HTTPS
         ↓
    Public internet
```

**nginx routing:**
- `step-now.de/api/v0/*` → FastAPI (port 8000)
- `step-now.de/admin/*` → Next.js
- `step-now.de/*` → Next.js (including `/en/*`)

FastAPI is never exposed directly to the public. Next.js calls FastAPI server-side via internal hostname.

**Hosting:** Hetzner Cloud (Germany region), mandatory for DSGVO simplicity. €10-20/month VPS.

---

## 4. The Five-Layer Request Flow

Every request flows through five layers, in order. **No layer skips the next.**

```
[Route]  →  [Controller]  →  [Service]  →  [Model]  ↔  [PostgreSQL]
   ↑              ↓               ↓
[Schema]   ←──────┴────  [Integrations: Email / Audit]
```

**Route** (`routes/api/v0/...`). HTTP protocol only. Path, verb, response model, dependencies via `Depends(...)`. 2-5 lines of body. No business logic, no DB queries.

**Controller** (`app/Http/Controllers/...`). Orchestrates. Calls Services. Maps Service returns → Pydantic. Catches `AppError` → `HTTPException`. Never opens a transaction, never writes SQL.

**Service** (`app/Services/...`). All business logic. Owns the transaction boundary. Calls external providers. `@staticmethod` only. No DI.

**Model** (`app/Models/...`). SQLAlchemy schema. Columns, relationships, indexes, soft-delete columns. No business methods.

**Schema** (`app/Schemas/...`). Pydantic v2 I/O. Request validation, response shaping.

---

## 5. Repository Layout

The backend lives at `apps/backend/` in the StepNow monorepo. All paths below are relative to that directory.

```
apps/backend/
├── main.py                       FastAPI app, middleware, lifespan, CORS, request logging
├── alembic.ini
├── alembic/versions/
├── requirements.txt
├── .env.example
├── logs/
│
├── config/
│   ├── settings.py               Pydantic singleton. The ONLY file that reads .env
│   ├── database.py               Engine, SessionLocal, get_db
│   └── email.py                  EmailSettings
│
├── routes/
│   ├── __init__.py               setup_api_routes(app)
│   └── api/
│       └── v0/
│           ├── public.py         Public reads + form submissions
│           ├── auth.py           Admin login, refresh, logout
│           └── admin/
│               ├── __init__.py
│               ├── ui_strings.py
│               ├── services.py
│               ├── pricing.py
│               ├── vehicles.py
│               ├── faqs.py
│               ├── testimonials.py
│               ├── legal_pages.py
│               ├── bookings.py
│               ├── contact_messages.py
│               ├── settings.py
│               ├── audit_log.py
│               └── trash.py
│
└── app/
    ├── Core/
    │   ├── Exceptions.py         AppError hierarchy
    │   └── ProtectedFields.py    Required-field constants
    │
    ├── Http/Controllers/
    │   ├── PublicController.py
    │   ├── AuthController.py
    │   └── admin/
    │       ├── UiStringsController.py
    │       ├── ServicesController.py
    │       ├── PricingController.py
    │       ├── VehiclesController.py
    │       ├── FaqsController.py
    │       ├── TestimonialsController.py
    │       ├── LegalPagesController.py
    │       ├── BookingsController.py
    │       ├── ContactMessagesController.py
    │       ├── SettingsController.py
    │       ├── AuditLogController.py
    │       └── TrashController.py
    │
    ├── Mixins/
    │   ├── TimestampMixin.py     created_at, updated_at
    │   └── SoftDeleteMixin.py    is_deleted, deleted_at, deleted_by
    │
    ├── Models/
    │   ├── base.py
    │   ├── __init__.py
    │   ├── admin.py              AdminUser, RefreshToken
    │   ├── audit.py              AuditLog (append-only)
    │   ├── ui_strings.py         UiString
    │   ├── settings.py           SiteSettings (singleton)
    │   ├── services.py           Service
    │   ├── pricing.py            PricingCategory, PricingItem
    │   ├── vehicles.py           Vehicle
    │   ├── faqs.py               Faq
    │   ├── testimonials.py       Testimonial
    │   ├── legal_pages.py        LegalPage, LegalPageVersion
    │   ├── bookings.py           BookingRequest
    │   └── contact.py            ContactMessage
    │
    ├── Schemas/
    │   ├── common.py             PaginationInfo, LocaleEnum, ApiError
    │   ├── public.py             Public reads + form submissions
    │   ├── auth.py
    │   └── admin/
    │       ├── ui_strings.py
    │       ├── services.py
    │       ├── pricing.py
    │       ├── vehicles.py
    │       ├── faqs.py
    │       ├── testimonials.py
    │       ├── legal_pages.py
    │       ├── bookings.py
    │       ├── contact_messages.py
    │       ├── settings.py
    │       ├── audit_log.py
    │       └── trash.py
    │
    ├── Services/
    │   ├── AuthService.py
    │   ├── BookingService.py
    │   ├── ContactService.py
    │   ├── ContentService.py     Services, FAQs, testimonials, pricing, vehicles
    │   ├── UiStringService.py
    │   ├── LegalPageService.py   With versioning + publish workflow
    │   ├── SettingsService.py
    │   ├── AuditService.py       Writes audit log
    │   ├── TrashService.py       Restore soft-deleted records
    │   ├── PublicReadService.py  Locale-filtered reads
    │   └── Notifications/
    │       └── Email/
    │           ├── EmailService.py
    │           ├── EmailDispatcher.py
    │           ├── TemplateRenderer.py
    │           ├── README.md
    │           └── Providers/
    │               ├── BaseEmailProvider.py
    │               └── PostmarkProvider.py
    │
    ├── Templates/
    │   └── emails/
    │       ├── base.html
    │       ├── booking/
    │       │   ├── confirmation_de.html / .txt
    │       │   ├── confirmation_en.html / .txt
    │       │   └── admin_notification.html / .txt
    │       └── contact/
    │           ├── confirmation_de.html / .txt
    │           ├── confirmation_en.html / .txt
    │           └── admin_notification.html / .txt
    │
    └── Utils/
        ├── Helpers.py            Auth deps, helpers
        ├── Logger.py
        ├── i18n.py               Locale resolver, _de/_en field picker
        ├── rate_limit.py
        └── validators.py
```

### Naming conventions

- **Directories** PascalCase (`Services/`, `Http/Controllers/`)
- **Service / Controller files** PascalCase
- **Model / Schema / Route files** snake_case
- All models stay flat in `app/Models/` — ~13 models total.

---

## 6. Configuration

`config/settings.py` is the **single source of truth** for environment configuration. It is the only file that reads from `.env`.

```python
# config/settings.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
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

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

`os.getenv` outside `config/settings.py` is forbidden (§18).

---

## 7. Database Discipline

**Synchronous sessions, full stop.**

**Transaction boundary at the Service.** Routes and Controllers never call `commit()` or `rollback()`.

**Eager loading is mandatory** on endpoints that touch relationships during serialization.

**Public/admin boundary at the route level:**

```python
# Public — only active, non-deleted
services = db.query(Service).filter(
    Service.active == True,
    Service.is_deleted == False,
).order_by(Service.sort_order).all()

# Admin — may include inactive, never includes hard-deleted
services = db.query(Service).filter(
    Service.is_deleted == False,
).order_by(Service.sort_order).all()

# Admin trash view — only soft-deleted
services = db.query(Service).filter(
    Service.is_deleted == True,
).order_by(Service.deleted_at.desc()).all()
```

**Soft delete on every editable table.** Every editable model uses `SoftDeleteMixin`. Default queries filter `is_deleted == False`.

**Audit log writes on every mutation.** Every Service mutation method calls `AuditService.log(...)` before the final commit (§15.1).

**JSONB mutations need `flag_modified`.**

**Timezone-aware UTC everywhere.** `datetime.now(timezone.utc)`, never `datetime.utcnow()`.

**Pagination contract.** `page` (≥1), `size` (1-100). Use `PaginationInfo` from `app/Schemas/common.py`.

---

## 8. The Bilingual Data Model

Every translatable text field is duplicated as `_de` and `_en` columns on the same row. The database is the **single source of truth** for all content displayed to users: UI strings, business content, and legal pages.

### 8.1 Three categories of content, one storage approach

| Category | Table | Examples | Editable by |
|---|---|---|---|
| **UI strings** | `ui_strings` | Button labels, form errors, nav items, hero copy | Naeem (admin) |
| **Business content** | `services`, `faqs`, `vehicles`, `pricing_*`, `testimonials`, `site_settings` | Service descriptions, FAQ, pricing | Naeem (admin) |
| **Legal pages** | `legal_pages`, `legal_page_versions` | Impressum, Datenschutz, AGB | Naeem (admin, versioned) |

All three follow the `_de` / `_en` pattern. Differences are in audit, versioning, and validation — not storage.

### 8.2 Example: Service model

```python
# app/Models/services.py
from app.Mixins.TimestampMixin import TimestampMixin
from app.Mixins.SoftDeleteMixin import SoftDeleteMixin

class Service(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    sort_order = Column(Integer, default=0, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    icon = Column(String(50))

    slug_de = Column(String(100), unique=True, nullable=False)
    slug_en = Column(String(100), unique=True, nullable=False)

    title_de = Column(String(200), nullable=False)
    title_en = Column(String(200), nullable=False)

    short_description_de = Column(String(500))
    short_description_en = Column(String(500))

    long_description_de = Column(Text)  # markdown
    long_description_en = Column(Text)  # markdown

    hero_image_url = Column(String(500))
    og_image_url = Column(String(500))

    meta_title_de = Column(String(200))
    meta_title_en = Column(String(200))
    meta_description_de = Column(String(300))
    meta_description_en = Column(String(300))
```

### 8.3 UI strings table

```python
# app/Models/ui_strings.py
class UiString(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "ui_strings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    key = Column(String(200), unique=True, nullable=False, index=True)
    namespace = Column(String(100), nullable=False, index=True)
    value_de = Column(Text, nullable=False)
    value_en = Column(Text, nullable=False)
    description = Column(String(500))     # Where this string appears (admin help text)
    is_locked = Column(Boolean, default=False, nullable=False)
```

Keys are dotted paths: `common.book_now`, `booking.step_service`, `errors.required`, `nav.services`. Namespaces group them.

`is_locked = True` means the admin form shows the value as read-only. Reserved for strings that, if broken, prevent the site from rendering (e.g., the language switcher labels themselves). The flag is set at seed time by the developer; admins cannot toggle it.

### 8.4 Locale resolution

```python
# app/Utils/i18n.py
from enum import Enum

class Locale(str, Enum):
    DE = "de"
    EN = "en"

def localized_field(obj, field: str, locale: Locale, fallback: Locale = Locale.DE):
    primary = getattr(obj, f"{field}_{locale.value}", None)
    if primary:
        return primary
    return getattr(obj, f"{field}_{fallback.value}", None)
```

Public response shaping in Services flattens to one language per request:

```python
def to_public_response(service: Service, locale: Locale) -> ServicePublicResponse:
    return ServicePublicResponse(
        id=service.id,
        slug=localized_field(service, "slug", locale),
        icon=service.icon,
        title=localized_field(service, "title", locale),
        short_description=localized_field(service, "short_description", locale),
        long_description=localized_field(service, "long_description", locale),
        hero_image_url=service.hero_image_url,
    )
```

**Admin responses always return both languages.** Naeem edits side-by-side.

### 8.5 Locale at the route boundary

```python
async def get_locale(
    accept_language: str | None = Header(None),
    locale: str | None = Query(None),
) -> Locale:
    if locale in ("de", "en"):
        return Locale(locale)
    if accept_language and accept_language.lower().startswith("de"):
        return Locale.DE
    return Locale.EN
```

### 8.6 UI strings bulk endpoint

```
GET /api/v0/public/ui-strings?locale=de
```

Response:
```json
{
  "common.book_now": "Jetzt buchen",
  "common.call_us": "Anrufen",
  "booking.step_service": "Service wählen",
  ...
}
```

HTTP `Cache-Control: public, max-age=300`. Revalidated via `If-Modified-Since` against the `ui_strings` table's max `updated_at`. When Naeem updates a string, the cache invalidates within 5 minutes.

---

## 9. Legal Pages — Versioned Editing

Legal pages get **version history** that ordinary content does not.

### 9.1 Model

```python
# app/Models/legal_pages.py
class LegalPage(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "legal_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    slug = Column(String(50), unique=True, nullable=False)
    # 'impressum', 'datenschutz', 'agb'

    published_version_id = Column(UUID, ForeignKey("legal_page_versions.id"), nullable=True)
    draft_version_id = Column(UUID, ForeignKey("legal_page_versions.id"), nullable=True)


class LegalPageVersion(Base, TimestampMixin):
    __tablename__ = "legal_page_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    legal_page_id = Column(UUID, ForeignKey("legal_pages.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)

    title_de = Column(String(200), nullable=False)
    title_en = Column(String(200), nullable=False)
    body_de = Column(Text, nullable=False)  # markdown
    body_en = Column(Text, nullable=False)  # markdown

    created_by = Column(UUID, ForeignKey("admin_users.id"), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    changes_summary = Column(Text)  # Auto-generated diff summary
```

### 9.2 Workflow

```
Naeem clicks "Impressum bearbeiten"
   ↓
LegalPageService.get_or_create_draft(slug="impressum")
   - If draft_version_id is NULL, clone published version → new draft
   - If draft exists, load it
   ↓
Naeem edits draft → save updates the draft (not the published version)
   ↓
Naeem clicks "Vorschau" → renders draft using public template
   ↓
Naeem clicks "Veröffentlichen"
   ↓
LegalPageService.publish_draft(slug="impressum")
   - Set legal_page.published_version_id = draft_id
   - Set draft.published_at = now(), draft.is_published = True
   - Clear draft_version_id
   - AuditService.log(action="publish")
   ↓
Public /impressum serves the new version
```

### 9.3 Rollback

```
GET /api/v0/admin/legal-pages/impressum/versions
   - Returns all versions, newest first
   - Naeem clicks "Wiederherstellen" on an old version
   ↓
LegalPageService.rollback_to_version(slug="impressum", version_id=...)
   - Clone chosen version → new version with new ID
   - Mark new version as published
   - Update legal_page.published_version_id
   - AuditService.log(action="rollback", notes="Rollback to version N")
```

**Old versions are never deleted.** This is the safety net.

### 9.4 Interpolation of dynamic facts

Legal page bodies reference `site_settings` via Mustache-style placeholders:

```markdown
StepNow Rides & Movers
Inhaber: Naeem Ahmad
{{ site_settings.address_street }}
{{ site_settings.address_postcode }} {{ site_settings.address_city }}

Telefon: {{ site_settings.phone }}
E-Mail: {{ site_settings.email }}

Konzession: {{ site_settings.concession_number }}
erteilt durch {{ site_settings.concession_authority }}
```

When Naeem updates his phone number in Settings, the Impressum updates everywhere automatically — without him touching the legal page body. Interpolation happens at the API boundary in `LegalPageService.render_for_public(slug, locale)`.

**Allowed placeholders** are documented in `app/Core/ProtectedFields.py`. Unknown placeholders render literally so they're visible in preview.

---

## 10. Site Settings

Single singleton row with all business facts.

```python
# app/Models/settings.py
class SiteSettings(Base, TimestampMixin):
    __tablename__ = "site_settings"
    __table_args__ = (CheckConstraint("id = 1", name="single_row"),)

    id = Column(Integer, primary_key=True, default=1)

    # Identity
    business_name = Column(String(200), nullable=False)
    owner_name = Column(String(200), nullable=False)
    legal_form = Column(String(100), nullable=False, default="Einzelunternehmen")

    # Address
    address_street = Column(String(200), nullable=False)
    address_postcode = Column(String(10), nullable=False)
    address_city = Column(String(100), nullable=False)
    address_country = Column(String(100), nullable=False, default="Deutschland")

    # Contact
    phone = Column(String(50), nullable=False)
    phone_mobile = Column(String(50))
    email = Column(String(200), nullable=False)
    whatsapp_url = Column(String(500))

    # Tax
    tax_number = Column(String(50))
    vat_id = Column(String(50))

    # Licensing
    concession_number = Column(String(100))
    concession_authority = Column(String(200))
    concession_date = Column(Date)

    # Hours (bilingual)
    opening_hours_de = Column(Text)
    opening_hours_en = Column(Text)

    # Social
    social_facebook = Column(String(500))
    social_instagram = Column(String(500))
    social_youtube = Column(String(500))
    social_tiktok = Column(String(500))

    # SEO defaults (bilingual)
    default_meta_title_de = Column(String(200))
    default_meta_title_en = Column(String(200))
    default_og_image_url = Column(String(500))
```

`GET /api/v0/public/settings?locale=de` returns the locale-resolved settings. Admin endpoint returns both languages.

---

## 11. Authentication

JWT + bcrypt. Single admin user (Naeem) seeded on first migration.

```python
# app/Services/AuthService.py
class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> AdminUser:
        user = db.query(AdminUser).filter(
            AdminUser.email == email,
            AdminUser.is_deleted == False,
        ).first()
        if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            raise AuthError("Invalid credentials")
        if not user.active:
            raise AuthError("Account inactive")
        return user
```

Refresh tokens stored in `refresh_tokens` table with `revoked_at` column. Rotation on each refresh.

```python
# app/Utils/Helpers.py
async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise AuthError("Invalid token")

    user = db.query(AdminUser).filter(
        AdminUser.id == user_id,
        AdminUser.is_deleted == False,
        AdminUser.active == True,
    ).first()
    if not user:
        raise AuthError("User not found or inactive")
    return user
```

All admin routes apply `current_admin = Depends(get_current_admin)`. No RBAC tiers — single role.

---

## 12. Email Subsystem

Same Strategy + Facade + Template Method pattern as Echooo. Scoped to one provider.

Template naming: `{category}/{name}_{locale}.html` and `.txt`. Dispatcher falls back to `_de` if `_{locale}` missing.

Two entry points:

```python
# From a request handler (preferred)
EmailService.send_template_in_background(
    background_tasks=background_tasks,
    to=booking.customer_email,
    template="booking/confirmation",
    locale=booking.language,
    subject_key="email.booking.confirmation.subject",  # resolved from ui_strings
    context={...},
)

# From a non-request context (cron, scheduler if added later)
await EmailService.send_template(
    to=booking.customer_email,
    template="booking/confirmation",
    locale=Locale.DE,
    subject_key="email.booking.confirmation.subject",
    context={...},
)
```

Every send logged to `email_logs` table.

---

## 13. Background Work

**Single tier.** FastAPI `BackgroundTasks` only at V1.

No APScheduler at V1. One operational job runs via OS cron, pointing to a script in the monorepo's `scripts/` directory:

```
# Daily database backup at 03:00 UTC
0 3 * * *  /opt/stepnow/scripts/backup_db.sh
```

The script is deployed from the monorepo's `scripts/backup_db.sh` file to `/opt/stepnow/scripts/backup_db.sh` on the host.

---

## 14. Error Handling

```python
# app/Core/Exceptions.py
class AppError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, **extra):
        super().__init__(message)
        self.message = message
        self.extra = extra

class DomainError(AppError):        status_code = 400; error_code = "DOMAIN_ERROR"
class AuthError(AppError):          status_code = 401; error_code = "AUTH_FAILED"
class ForbiddenError(AppError):     status_code = 403; error_code = "FORBIDDEN"
class NotFoundError(AppError):      status_code = 404; error_code = "NOT_FOUND"
class ConflictError(AppError):      status_code = 409; error_code = "CONFLICT"
class RateLimitError(AppError):     status_code = 429; error_code = "RATE_LIMITED"

class RequiredFieldError(DomainError):
    """Raised when admin tries to clear a legally-required field."""
    error_code = "REQUIRED_FIELD"
```

Services raise `AppError` subclasses, never `HTTPException`. Controllers translate. Global handler emits consistent JSON:

```json
{
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "Telefon ist gesetzliche Pflicht (§ 5 TMG).",
    "extra": {"field": "phone"}
  }
}
```

---

## 15. Operational Safeguards

The seven safeguards that make the all-DB approach safe. These are not optional — removing or weakening any of them requires explicit re-acknowledgement of the §1.2 risks.

### 15.1 Audit Log

Every editable table change writes a row to `audit_log`. **Append-only** — no UPDATE or DELETE allowed on it from application code.

```python
# app/Models/audit.py
class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor_id = Column(UUID, ForeignKey("admin_users.id"), nullable=True)
    actor_email = Column(String(200))  # Denormalized — preserved if user soft-deleted

    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(String(100), nullable=False, index=True)

    action = Column(String(20), nullable=False)
    # 'create' | 'update' | 'soft_delete' | 'restore' | 'hard_delete' | 'publish' | 'rollback'

    changes = Column(JSONB, nullable=False)
    # { "field_name": { "old": "...", "new": "..." }, ... }

    ip_address = Column(String(50))
    user_agent = Column(String(500))
    notes = Column(Text)  # Optional admin-provided note
```

**Writing entries:**

```python
# app/Services/AuditService.py
class AuditService:
    @staticmethod
    def log(
        db: Session,
        actor: AdminUser | None,
        table_name: str,
        record_id: str,
        action: str,
        before: dict | None,
        after: dict | None,
        request: Request | None = None,
        notes: str | None = None,
    ):
        changes = AuditService._diff(before, after)
        entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            table_name=table_name,
            record_id=str(record_id),
            action=action,
            changes=changes,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
            notes=notes,
        )
        db.add(entry)
        # Caller commits as part of its own transaction

    @staticmethod
    def _diff(before: dict | None, after: dict | None) -> dict:
        if before is None:
            return {k: {"old": None, "new": v} for k, v in (after or {}).items()}
        if after is None:
            return {k: {"old": v, "new": None} for k, v in (before or {}).items()}
        diff = {}
        for k in set(before.keys()) | set(after.keys()):
            if before.get(k) != after.get(k):
                diff[k] = {"old": before.get(k), "new": after.get(k)}
        return diff
```

**Discipline:** every Service mutation method calls `AuditService.log(...)` before the final commit. Enforced by code review, not by ORM event hooks — we want explicit intent including the action verb.

Admin audit-log view at `/admin/audit-log` shows recent changes paginated, filtered by table/actor/date.

### 15.2 Soft Delete with Restore (Trash)

Every editable model uses `SoftDeleteMixin`:

```python
# app/Mixins/SoftDeleteMixin.py
class SoftDeleteMixin:
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
```

**Delete flow:** admin "Löschen" sets `is_deleted=True`. Public stops showing. Trash view shows it with "Wiederherstellen".

**Restore flow:** clears soft-delete columns. Record reappears (if active).

**No automatic purge.** Soft-deleted records stay indefinitely. Manual purge available via admin-only endpoint with explicit confirmation, audit-logged.

### 15.3 Required Field Validation

`app/Core/ProtectedFields.py` lists fields that cannot be cleared:

```python
"""Fields that must never be empty."""

LEGALLY_REQUIRED_FIELDS = {
    "site_settings": {
        "business_name": "Geschäftsname ist gesetzliche Pflicht (§ 5 TMG).",
        "owner_name": "Inhaber-Name ist gesetzliche Pflicht (§ 5 TMG).",
        "address_street": "Adresse ist gesetzliche Pflicht (§ 5 TMG).",
        "address_postcode": "PLZ ist gesetzliche Pflicht (§ 5 TMG).",
        "address_city": "Ort ist gesetzliche Pflicht (§ 5 TMG).",
        "phone": "Telefon ist gesetzliche Pflicht (§ 5 TMG).",
        "email": "E-Mail ist gesetzliche Pflicht (§ 5 TMG).",
    },
}
```

Enforced in the Service:

```python
class SettingsService:
    @staticmethod
    def update(db: Session, data: dict, actor: AdminUser, request: Request) -> SiteSettings:
        settings_row = db.query(SiteSettings).first()
        before = SettingsService._snapshot(settings_row)

        for field, value in data.items():
            required = LEGALLY_REQUIRED_FIELDS.get("site_settings", {})
            if field in required and not value:
                raise RequiredFieldError(required[field], field=field)
            setattr(settings_row, field, value)

        after = SettingsService._snapshot(settings_row)
        AuditService.log(db, actor, "site_settings", "1", "update", before, after, request)
        db.commit()
        return settings_row
```

Frontend renders the error inline next to the field.

### 15.4 Versioned Legal Pages

Covered in §9. Every save creates a new version. Old versions kept indefinitely. Rollback is one click.

### 15.5 Preview Before Publish

Two-step flow for legal pages (and homepage hero, via `is_draft` flag on relevant settings fields):

1. Naeem edits → save creates/updates a draft
2. Draft is not visible on public site
3. "Vorschau" renders the draft using the actual public template
4. "Veröffentlichen" promotes draft → published

For ordinary content (services, FAQ, vehicles, etc.), there is no draft step. Save immediately publishes.

### 15.6 Daily Backups

Cron job runs `pg_dump` daily, uploads to S3-compatible storage. 30-day retention. Restoration procedure documented in `docs/runbooks/restore-db.md`.

Hetzner snapshot of the entire VPS taken daily — separate failure domain.

### 15.7 Warning Banner on Legal Edits

Backend exposes `is_legal_content: true` flag on the relevant resources. Frontend renders a non-blocking warning banner on the edit form. No additional clicks required — informed consent at the moment of editing.

---

## 16. Rate Limiting and Spam Protection

Three layers on public form endpoints:

**1. Per-IP rate limiting** via `slowapi`:
```python
@router.post("/public/bookings")
@limiter.limit(settings.BOOKING_RATE_LIMIT)
async def create_booking(...):
    ...
```

**2. Honeypot field:**
```python
class BookingCreate(BaseModel):
    pickup_address: str
    # ... real fields

    website: str | None = Field(None, max_length=0)

    @field_validator("website")
    @classmethod
    def honeypot_must_be_empty(cls, v):
        if v:
            raise ValueError("Spam detected")
        return v
```

**3. Optional hCaptcha** if spam becomes a problem. Toggle via settings.

---

## 17. Adding a New Feature, End to End

When you build a new feature called `voucher_codes`:

1. **Schema** — `app/Schemas/admin/voucher_codes.py` + public schema if applicable
2. **Model** — `app/Models/voucher_codes.py`. Include `TimestampMixin` and `SoftDeleteMixin`. Add `_de`/`_en` columns for any translatable text.
3. **Alembic migration** — generate, hand-check
4. **Service** — `app/Services/VoucherCodeService.py`. Static methods. Owns transactions. **Calls `AuditService.log(...)` on every mutation.**
5. **Required field protection** — if any field is critical, add to `app/Core/ProtectedFields.py`
6. **Controller** — `app/Http/Controllers/admin/VoucherCodesController.py`
7. **Route** — `routes/api/v0/admin/voucher_codes.py`
8. **Register the router** — `routes/__init__.py`

If it sends email, templates under `app/Templates/emails/<category>/`.

---

## 18. What Is Forbidden

These rules are non-negotiable.

- **SQLAlchemy queries inside a Route or Controller.** Queries live in Services.
- **Returning raw ORM objects to the client.** Always shape via Schema.
- **Any public endpoint that returns inactive or deleted records.**
- **Mutations in any Service without an `AuditService.log(...)` call.**
- **Clearing a field listed in `app/Core/ProtectedFields.py`.** Raise `RequiredFieldError` instead.
- **Hard delete via the admin UI.** Soft delete only.
- **Bypassing the legal-page versioning workflow.** Direct UPDATE on `legal_pages` from a Service is forbidden.
- **UPDATE or DELETE on `audit_log` rows.** Append-only.
- **`requests`, `time.sleep`, or blocking file I/O inside an `async def` handler.**
- **`db.commit()` or `db.rollback()` outside a Service.**
- **`os.getenv` anywhere except `config/settings.py`.**
- **`datetime.utcnow()` — deprecated.** Use `datetime.now(timezone.utc)`.
- **Lazy loading of relationships during response serialization.**
- **Instantiating a Service (`AuthService()`).** Services are static.
- **Raising `HTTPException` from inside a Service.** Raise `AppError`.
- **Silent `except:` blocks that swallow exceptions without logging.**
- **Reaching into `app/Services/Notifications/Email/` internals.** Use `EmailService`.
- **Mixing locales in a single public response payload.**
- **Storing translatable content in only one language.** Every `_de` field must have a paired `_en` field.
- **Exposing admin routes without `Depends(get_current_admin)`.**
- **CORS allowing `*` in production.** Only `step-now.de` is allowed.
- **Concatenating user input into an LLM prompt** if LLM features are added later.

---

## 19. What Echooo Has That StepNow Does NOT

Deliberate omissions:

| Echooo concept | Why omitted from StepNow |
|---|---|
| Multi-tenancy (`company_id` filter) | Single tenant. |
| RBAC hierarchy (`has_role`, `has_permission`) | Single admin role. |
| WebSocket layer | No realtime use case. |
| APScheduler + multiple schedulers | No recurring jobs at V1 (backups via OS cron). |
| `BackgroundTasksContextMiddleware` | Only the FastAPI BackgroundTasks path is used. |
| Multi-provider email Strategy | One provider. Pattern preserved for future. |
| Subscription, quota, billing, finance, payments subsystems | Not relevant. |
| Storage abstraction (GCS / S3 / Azure / Local) | Local filesystem at V1. |
| EventDeduplicationService | No event broadcasting. |
| `b2b_agency_model_a` quota logic | No agency model. |

Adding any of these later is acceptable when a real need emerges. Adding them speculatively is overengineering.

---

## 20. CORS and Frontend Contract

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Accept-Language"],
)
```

**API versioning:** All routes under `/api/v0/`.

**Response envelope:** Successful responses return data directly. Errors use the §14 envelope. Paginated lists use `PaginationInfo`.

**API documentation:** FastAPI's OpenAPI at `/api/v0/docs` in dev/staging, disabled in production.

---

## 21. Living Document

This file is updated whenever a new subpackage is introduced, a convention changes, or a forbidden practice is added.

The code is the source of truth. This document is the map.

**Cross-references:**

- Frontend disciplines: `docs/architecture/frontend.md`
- Page-level content specifications: `docs/website-outline.md`
- Visual design direction: `docs/design-direction.md`
- Live-site triage checklist: `docs/triage-checklist.md`
- Legal page drafts: `docs/legal/`
- Echooo backend `ARCHITECTURE.md` is the canonical source for the disciplines this document inherits. When patterns are ambiguous, check Echooo's version first.
