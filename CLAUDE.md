# StepNow — Monorepo

German transport company admin system. Two apps, one repo.
Each app has its own CLAUDE.md — read it before touching that app.

## Layout

```
D:\Office Works\stepnow\
├── CLAUDE.md
├── apps/
│   ├── backend/CLAUDE.md   ← FastAPI / SQLAlchemy sync / PostgreSQL / Alembic
│   └── frontend/CLAUDE.md  ← Next.js 15 / React 19 / TanStack Query / Tailwind
├── deploy/nginx/ + systemd/
└── scripts/deploy.sh
```

## Commands

```bash
# Backend
cd apps/backend && source venv/bin/activate
uvicorn main:app --reload            # dev :8000
alembic upgrade head
alembic revision --autogenerate -m "<msg>"
pytest tests/ -x

# Frontend
cd apps/frontend
npm run dev                          # :3000
npm run build && npm run lint && npx tsc --noEmit

# Deploy (VPS)
bash scripts/deploy.sh               # pull → pip → npm build → systemd restart
```

## Deployment

Hostinger VPS. nginx reverse proxy. Let's Encrypt HTTPS.
`step-now.de` → frontend `:3000` | `api.step-now.de` → backend `:8000`
Systemd: `stepnow-backend` + `stepnow-frontend`.
Email: Hostinger SMTP `smtp.hostinger.com:465 SSL`.
Mailboxes: `info@` `rides@` `movers@` `accounts@step-now.de`.

## Domain

| Domain | Tables |
|---|---|
| Orders / courier | `orders` `invoices` `payments` |
| Customers | `customers` |
| Drivers + Vehicles | `drivers` `vehicles` |
| Expenses | `expenses` |
| Bookings | `bookings` |
| Content | `services` `pricing` `faqs` `testimonials` `legal_pages` `ui_strings` |
| System | `site_settings` `admin_users` `email_logs` |

**Orders attach to a vehicle, not a driver.**
German-language field labels — match `StepNow_Buchhaltung.html`.

## Cross-Cutting Invariants

1. Browser never calls FastAPI — all requests through `/api/v0/*` BFF.
2. `any` banned. TypeScript strict. `unknown` + type guards at untrusted edges.
3. Secrets server-side only. `NEXT_PUBLIC_*` is the only browser-reachable prefix.
4. Auth token in `localStorage` (`accessToken` + `refreshToken`). `nextjsApiClient` attaches `Authorization: Bearer <token>`; BFF reads it via `extractBearerToken` / `requireAdminToken`. Route protection is client-side (`(authed)/layout.tsx` guard). No auth cookies.
5. Soft-delete everywhere. `is_deleted = True` + `deleted_at` on write. Filter on every read.
6. Money is `Decimal` — never `float`. Always paired with currency (EUR default).
7. DB is single source of truth — no hardcoded domain values in code.
8. All URLs in `ENDPOINTS.*` — never inline.
9. All client reads via React Query hooks. No raw `fetch` or `useEffect`+`useState` for data.
10. API routes follow the API Flow guide: `extractBearerToken` → per-resource `{resource}.admin.server.ts` → `NextResponse.json`, with `catch → apiErrorResponse`. No `bffHandler`/`admin-bff` abstraction.

## Precedence

**Correctness > Consistency > Simplicity > Velocity**

Existing codebase pattern wins over external best practices.
