# StepNow Frontend

Next.js 14 App Router + Tailwind. Bilingual (DE primary, EN at `/en`). BFF pattern — browser → Next.js Route Handlers → FastAPI.

## Quickstart

```bash
cd apps/frontend
npm install
cp .env.example .env.local      # adjust BACKEND_API_URL if FastAPI runs elsewhere
npm run dev                      # http://localhost:3000
```

Backend must be running at `http://localhost:8000` (see `apps/backend/README.md`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

See `docs/architecture/frontend.md`. Highlights:

- **BFF routing**: browser → `/api/v0/*` (Next.js Route Handlers) → FastAPI. Browser never touches FastAPI URL directly.
- **Auth**: httpOnly cookies (`sn_access`, `sn_refresh`). JS cannot read tokens.
- **i18n**: DB-backed UI strings via `/api/v0/public/ui-strings`. No JSON files.
- **Field naming**: snake_case throughout (matches backend Pydantic).
- **3-tier components**: `ui/` (primitives) → `shared/` (composites) → `features/` (feature-specific).
- **Service split**: every resource has `<resource>.client.ts` (browser) + `<resource>.server.ts` (RSC/BFF).

## Folder layout

See `docs/architecture/frontend.md` §6 for the full tree.

## Forbidden

See `docs/architecture/frontend.md` §13. Quick highlights:

- No direct browser → FastAPI calls
- No reading auth tokens in JS
- No `localStorage`/`sessionStorage` for tokens
- No hardcoded user-facing strings (always `t()`)
- No camelCase in API types (use snake_case)
- No Google Fonts CDN, Google Analytics, Google Maps (DSGVO)
