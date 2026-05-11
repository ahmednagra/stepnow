# StepNow Rides & Movers

Monorepo for the StepNow website — a regional German Mietwagen (passenger transport with driver) operator, marketed as **TAXI-Alternative**, serving the Stuttgart / Esslingen / Deizisau region.

**Live site:** [step-now.de](https://step-now.de)

---

## What's in this repo

```
stepnow/
├── apps/
│   ├── backend/        FastAPI + SQLAlchemy + PostgreSQL (Python 3.12+)
│   └── frontend/       Next.js 14+ App Router + Tailwind + React Query (TypeScript)
├── docs/               Architecture, content outline, legal drafts, runbooks
├── scripts/            Operational scripts (DB backup, deploy, seed)
├── infra/              nginx config, systemd unit files, docker-compose for local dev
└── README.md           You are here
```

---

## Quick navigation

If you're new to this codebase, start in `docs/`:

- **[docs/INDEX.md](./docs/INDEX.md)** — the index of all documentation
- **[docs/architecture/backend.md](./docs/architecture/backend.md)** — backend disciplines, repository layout, request flow
- **[docs/architecture/frontend.md](./docs/architecture/frontend.md)** — frontend disciplines, component tiers, i18n strategy
- **[docs/website-outline.md](./docs/website-outline.md)** — every page, section by section
- **[docs/design-direction.md](./docs/design-direction.md)** — visual direction, type system, photography strategy

If you're picking up a specific task:

- **Building a new feature?** Read `docs/architecture/backend.md` §17 and `docs/architecture/frontend.md` §18 — both have step-by-step "add a new feature" guides.
- **Editing content via admin?** That's Naeem's job. See `docs/architecture/backend.md` §15 for the safeguards that protect content edits.
- **Fixing the live site?** Read `docs/triage-checklist.md` — the prioritized list of fixes for the current production template.

---

## Tech stack at a glance

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Uvicorn) |
| Backend language | Python 3.12+ |
| ORM | SQLAlchemy (synchronous sessions) |
| Database | PostgreSQL |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Frontend framework | Next.js 14+ (App Router) |
| Frontend language | TypeScript (strict) |
| Styling | Tailwind CSS |
| State (admin) | TanStack React Query v5 |
| State (UI) | Zustand |
| Forms | React Hook Form + Zod |
| i18n | Custom (route-prefix `/` and `/en/`, DB-sourced UI strings) |
| Email | Postmark (or Resend) |
| Auth | JWT (HS256) + bcrypt |
| Hosting | Hetzner Cloud (Germany region) |
| Reverse proxy | nginx |
| Analytics | Plausible (DSGVO-compliant) |
| Maps | Leaflet + OpenStreetMap |

---

## Local development

### Prerequisites

- Python 3.12+ (`pyenv` recommended)
- Node.js 20+ and `pnpm` (or `npm`)
- PostgreSQL 16+ (locally or via Docker)
- Postmark or Resend API key (for email — optional in dev)

### First-time setup

```bash
# Clone
git clone <repo-url> stepnow
cd stepnow

# Backend
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in DATABASE_URL, JWT_SECRET_KEY, etc.
alembic upgrade head
python scripts/seed_admin.py   # creates the initial admin user

# Frontend
cd ../frontend
pnpm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL, INTERNAL_API_URL
```

### Running locally

Open two terminals:

```bash
# Terminal 1 — Backend
cd apps/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd apps/frontend
pnpm dev      # runs on port 3000
```

Visit `http://localhost:3000` for the German site, `http://localhost:3000/en` for the English site.

Admin: `http://localhost:3000/admin/login` — use credentials seeded by `seed_admin.py`.

API docs (dev only): `http://localhost:8000/api/v0/docs`.

---

## Languages

The site is fully bilingual:

- **German (default):** served at `step-now.de/` (no language prefix)
- **English:** served at `step-now.de/en/`

All content — including UI strings, page text, and legal pages — comes from the database with `_de` and `_en` columns. See `docs/architecture/frontend.md` §9 for the i18n implementation details.

---

## Deployment

The monorepo deploys to a single Hetzner Cloud VPS in Germany, with nginx routing traffic to both apps:

- `/api/v0/*` → FastAPI on `localhost:8000`
- `/admin/*` → Next.js on `localhost:3000` (auth-gated client-side)
- `/*` → Next.js on `localhost:3000`

Deployment scripts and infrastructure config live in `scripts/` and `infra/`. Detailed deploy procedure: `docs/runbooks/deploy.md` (to be written when the deploy pipeline is set up).

---

## Legal and Compliance Notes

This is a **German Mietwagen operator** subject to specific regulations:

- **§ 5 TMG** requires an Impressum on every public page (linked from footer)
- **DSGVO** requires a privacy policy with specific disclosures
- **PBefG § 49** governs passenger transport with rental cars
- **UWG** prohibits misleading advertising (including fake testimonials, false ratings)

The business owner (Naeem Ahmad, Einzelunternehmer) has admin access to edit all content including legal pages. This is an explicit business decision with documented risks — see `docs/architecture/backend.md` §1.2 ("Risk Acknowledgement"). Operational safeguards (audit log, soft delete, versioning, required-field validation, preview-before-publish, daily backups, warning banners) mitigate the risks but do not eliminate them.

**Do not weaken or remove these safeguards without re-acknowledging the risks in writing.**

---

## Contributing

This is a single-developer project at present. Conventions live in:

- `docs/architecture/backend.md` §18 — forbidden practices (backend)
- `docs/architecture/frontend.md` §19 — forbidden practices (frontend)

A PR that contradicts either document without an accompanying doc update is rejected. The architecture documents are living references — when the code disagrees with the docs, the code wins and the docs are updated in the same PR.

---

## License

Proprietary. © StepNow Rides & Movers, Naeem Ahmad. All rights reserved.
