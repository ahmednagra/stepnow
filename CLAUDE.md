# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# StepNow — Monorepo

German licensed transport + courier company — **StepNow Rides & Movers, Naeem Ahmad e.K.** (Blumenstraße 8, 73779 Deizisau; Handelsregister **HRA 742905 · AG Stuttgart**; Steuer-Nr. **59500/72609**; Stuttgart/Esslingen region). The passenger side is § 49 PBefG *Mietwagen mit Fahrer*; the day-to-day billed business is B2B courier *Sonderfahrten* for freight forwarders (the reference `Transportauftrag` / `Rechnung` PDFs and `StepNow_Data-1.json` are canonical for that path).
Two apps, one repo: a bilingual public marketing+booking website and an internal admin/ops panel.
**Each app has its own CLAUDE.md with the canonical patterns — read it before touching that app.**

## Layout

```
stepnow/
├── CLAUDE.md
├── apps/
│   ├── backend/CLAUDE.md   ← FastAPI · SQLAlchemy sync · PostgreSQL · Pydantic v2
│   └── frontend/CLAUDE.md  ← Next.js 14 App Router · React 18 · TanStack Query v5 · Tailwind
├── deploy/nginx/ + systemd/
└── scripts/deploy.sh
```

> The two `apps/*/README.md` files are **stale** (backend says "not initialized"; frontend says Next 14 + httpOnly-cookie auth). Trust the CLAUDE.md files, not the READMEs.

## Commands

```bash
# Backend (apps/backend, venv active)
uvicorn main:app --reload                 # dev :8000
python -m scripts.seed                     # (re)seed — idempotent, safe to re-run
python -m scripts.backup_db                # pg_dump -> local + optional S3, prunes by retention
pytest tests/ -x                           # all tests, stop on first failure
pytest tests/test_finance.py -k vat        # a single test / pattern

# Frontend (apps/frontend)
npm run dev                                # :3000  (needs backend on :8000)
npm run build                              # production build
npm run typecheck                          # tsc --noEmit  ← the reliable pre-commit gate
```

> `npm run build` needs a backend on `:8000` — the public pages are RSC and prerender real data,
> so a build without the API fails on `/dienstleistungen` and `/preise`. The reliable offline gate
> is `npm run typecheck && npx eslint src`.

## Architecture (the big picture)

**Two request paths, one BFF boundary.** The browser never calls FastAPI directly — everything goes through Next.js Route Handlers at `/api/v0/*`.

- **Public pages** (`app/(public)/*` DE, `app/en/*` EN) are **RSC** that call `*.server.ts` services → `serverApiClient` → FastAPI **public** routes (`/public/*`, no auth). ISR via `export const revalidate`; slow sections stream behind `<Suspense>`.
- **Admin pages** (`app/admin/(authed)/*`) are **client components** using TanStack Query hooks → `*.client.ts` → `/api/v0/admin/*` BFF route → `*.admin.server.ts` → FastAPI **admin** routes. The BFF route extracts the bearer token (`extractBearerToken`) and forwards it. Route protection is client-side (`(authed)/layout.tsx`), because the localStorage token isn't server-readable.

**Core domain lifecycle — booking → order → invoice → payment:**
1. Public 5-step wizard (`features/booking/WizardShell`) POSTs to `/public/bookings` → writes a `booking_requests` row (status `new`). **No price is computed** — the public flow is request-only; staff quote manually (the site advertises a ≤30-min reply, not an instant fare).
2. Admin `POST /admin/bookings/{id}/convert-to-order` snapshots customer/route into an `orders` row (VAT resolved from the service, booking → `confirmed`).
3. Optional `Invoice` (`invoice_number` = `R` + order number, §14 UStG) and one or more `Payment` rows. **Paid state is derived from `sum(payments)`** — there is no boolean paid flag. An invoice is editable only while `status = draft`; after `issue` it is a Buchungsbeleg — correct it with `cancel` (Storno) + a replacement, which gets the next `-{revision}` suffix.
4. `Order.status` (financial: open→completed/cancelled) is independent of `Order.delivery_status` (courier: draft→dispatched→picked_up→delivered). **Orders attach to a vehicle, not a driver.**

**Schema & seeding — the models ARE the schema. No migration files.**
- `sync_schema()` in `main.py` runs on every boot and makes the database match `Base.metadata`:
  creates missing tables, **adds missing columns**, creates missing indexes, and drops a legacy
  plain `UNIQUE` once a partial (soft-delete-aware) index supersedes it. Every step is additive
  and idempotent — edit the model, restart, done.
- `seed_counters()` follows it, aligning the `counters` table with the highest number already
  issued so an order number, Kunden-Nr. or Rechnungsnummer is never reissued.
- Uniqueness on a soft-deletable column uses `live_unique(...)` from `app/Models/base.py`
  (`UNIQUE … WHERE is_deleted = false`) — a plain `UNIQUE` would keep a deleted row's value
  reserved forever while the service-layer guard reports it free.
- Data is loaded by idempotent seeders in `scripts/seeders/` (run via `python -m scripts.seed`, or `AUTO_SEED_ON_STARTUP=true` in non-prod). Seeders **skip rows that already exist**, so changing seed values only affects a fresh DB.

**i18n & locale routing.** DE is the default; DE routes are bare (`/preise`), EN routes are mirrored under `/en/*`. `middleware.ts` reads the `stepnow_locale` cookie and translates between locales using `ROUTE_MAP`/`REVERSE_ROUTE_MAP` (static routes only). UI strings live in the **`ui_strings` DB table** (admin-editable), fetched via `/public/ui-strings`; components resolve them with `t(key)` / `pickT(t, key, fallback)` — there are no JSON locale files.

**Theming — two layers, both gold/charcoal/cream + Cormorant serif.** Colors come from Tailwind tokens (`gold`, `gold-deep`, `charcoal`, `cream`, `ink` in `tailwind.config.ts`) **and** CSS variables in `globals.css` `:root` (`--color-accent-primary`, `--color-bg-strong`, `--color-text-primary`, …). Most feature/shared components use `var(--color-*)`; UI primitives (`components/ui/*`) use Tailwind tokens. To recolor the site globally, edit the `:root` variables — they cascade to ~40 components. Cormorant (serif) is for H1/H2 + editorial text; Inter (sans) for everything functional.

**Realtime.** A single in-process WebSocket `connection_manager` (channels `admin`, `user:{id}`, `order:{id}`) pushes order events + notifications to the admin UI. WS auth uses a `?token=` query param (browsers can't set WS headers).

## Deployment

Hostinger VPS, nginx reverse proxy, Let's Encrypt HTTPS.
`step-now.de` → frontend `:3000` · `api.step-now.de` → backend `:8000`. Systemd: `stepnow-backend` + `stepnow-frontend`.
Email via Hostinger SMTP `smtp.hostinger.com:465 SSL`; mailboxes `info@` `rides@` `movers@` `accounts@step-now.de` (`rides`=bookings, `movers`=driver slips, `accounts`=invoices/system).
`bash scripts/deploy.sh` = pull → pip → npm build → systemd restart.
Nightly `pg_dump` at 03:15 via `stepnow-backup.timer` (installed and enabled by deploy.sh);
keeps `BACKUP_RETENTION_DAYS` of dumps in `BACKUP_DIR`, uploads to S3 when `BACKUP_S3_*` is set.
Set `PG_DUMP_PATH` if `pg_dump` is not on PATH.

## Domain

| Domain | Tables |
|---|---|
| Orders / courier | `orders` `invoices` `payments` |
| Customers | `customers` |
| Drivers + Vehicles | `drivers` `vehicles` `driver_vehicle_assignments` |
| Expenses (legacy import) | `expenses` `expense_categories` |
| Bookings | `booking_requests` |
| Content | `services` `pricing_categories` `pricing_items` `faqs` `testimonials` `legal_pages` `ui_strings` |
| System | `site_settings` `admin_users` `notifications` `audit_log` `email_logs` `contact_messages` `message_delivery` |

German-language public field labels — match `StepNow_Buchhaltung.html`. VAT rates are **DB-owned**:
`services.vat_rate` per service, falling back to `site_settings.vat_rate_standard` (19%, courier /
Sonderfahrt) — `site_settings.vat_rate_reduced` (7%) is the PBefG passenger rate. Resolved by
`vat_rate_for(db, service_id, service_type)`; never hardcoded, editable in admin → Settings. Customers carry a canonical Kunden-Nr. (`customer_number`, K911-series, e.g. `K911053`). The two billing documents: **Transportauftrag** (driver run-sheet, no price, order no. `A-…`) and **Rechnung** (§14 UStG invoice, no. `R…`, with the IBAN/BIC bank block + `HRA 742905 · AG Stuttgart` footer). Issuer/bank/register details live in `site_settings` (admin → Settings), never hardcoded. The PDFs are generated by `DriverSlipPdfService` / `InvoicePdfService` (reportlab) and must match the reference templates in `Refrence Material/Docs/`.

## Cross-Cutting Invariants

1. Browser never calls FastAPI — all requests through `/api/v0/*` BFF.
2. `any` banned. TypeScript strict. `unknown` + type guards at untrusted edges.
3. Secrets server-side only. `NEXT_PUBLIC_*` is the only browser-reachable prefix.
4. Auth token in `localStorage` (`accessToken` + `refreshToken`). `nextjsApiClient` attaches `Authorization: Bearer <token>`; BFF reads it via `extractBearerToken`. Route protection is client-side (`(authed)/layout.tsx`). No auth cookies. (The frontend README's httpOnly-cookie claim is obsolete.)
5. Soft-delete everywhere. `is_deleted = True` + `deleted_at` on write; filter `is_deleted == False` on every read.
6. Money is `Decimal` — never `float`. Always paired with currency (EUR default). VAT rate stored at 4 decimals.
7. DB is single source of truth — no hardcoded domain values, rates, or strings in code. VAT comes from `services`/`site_settings`; sequential numbers come from the `counters` table, never from `COUNT(*)`.
8. All frontend URLs in `ENDPOINTS.*` — never inline. All user-facing copy via `t()` — never hardcoded.
9. All admin client reads via React Query hooks. No raw `fetch` or `useEffect`+`useState` for data.
10. API routes: `extractBearerToken` → per-resource `{resource}.admin.server.ts` → `NextResponse.json`, `catch → apiErrorResponse`. No `bffHandler`/`admin-bff` abstraction.
11. DSGVO: no third-party tracking/CDN without consent (no Google Fonts CDN / Analytics / Maps embed by default).
12. Backend is **sync** SQLAlchemy — `await` only for WebSocket sends and post-commit background tasks. `model_validate`/`model_dump`, never `from_orm`.

## Precedence

**Correctness > Consistency > Simplicity > Velocity**
Existing codebase pattern wins over external best practices. When old code conflicts with the current pattern, migrate to the current pattern on contact.
