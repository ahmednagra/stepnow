<div align="center">

# Echooo Platform — Architecture Blueprint

**Layering · Naming · Wiring · Safety Contract**

*A normative reference for every contributor — human or AI.*

</div>

---

> **What this document is.** The binding specification for *how code is shaped*
> in the Echooo backend: the four-layer flow, naming law, wiring rules, the
> pre-merge safety contract, and the feature-design gate. It does not catalog
> files (see the *Project Structure Reference* for that); it defines the rules
> those files must obey.
>
> **How to apply it.** Before writing or moving code, confirm the layer
> (§1), apply the naming law (§2), respect the wiring rules (§3), and clear the
> safety contract (§5) before returning anything. New features additionally pass
> the design gate (§4). When rules collide, resolve by precedence:
> **Correctness › Consistency › Simplicity › Velocity.**

---

## 1. The Four Layers — Downward-Only

Control and data flow in **one direction: down**. A layer may call the layer
immediately beneath it. It must never reach upward, nor reach sideways into a
peer's internals.

```
        REQUEST
           │
           ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ① ROUTER                                      routes/api/v0/*.py      ║
║  ────────────────────────────────────────────────────────────────────║
║  Owns   URL paths and the RBAC gate — nothing else.                    ║
║  Does   Depends(has_permission("domain:action")).                      ║
║  Never  runs a query, maps a schema, or holds business logic.          ║
╚════════════════════════════════╤═══════════════════════════════════════╝
                                 │  calls
                                 ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ② CONTROLLER                  app/Http/Controllers/*Controller.py     ║
║  ────────────────────────────────────────────────────────────────────║
║  Owns   HTTP orchestration.                                            ║
║  Does   try/except + logger · schema mapping (model_validate) ·        ║
║         re-raises HTTPException · wraps the unexpected as a logged 500. ║
║  Never  contains business rules or transactions.                       ║
╚════════════════════════════════╤═══════════════════════════════════════╝
                                 │  calls
                                 ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ③ SERVICE                     app/Services/**/*.py                    ║
║  ────────────────────────────────────────────────────────────────────║
║  Owns   business logic, transactions, row locking (with_for_update),   ║
║         access-grant scoping.                                          ║
║  Does   raise HTTPException for callers to surface.                    ║
║  Never  imports anything HTTP-shaped — services do not know the web.   ║
╚════════════════════════════════╤═══════════════════════════════════════╝
                                 │  calls
                                 ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ④ MODEL                       app/Models/*.py                         ║
║  ────────────────────────────────────────────────────────────────────║
║  Owns   persistence only.                                              ║
║  Does   columns · relationships · indexes · CHECK constraints ·        ║
║         the soft-delete trio (is_deleted / deleted_at / deleted_by).   ║
║  Never  contains logic beyond persistence concerns.                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

> **Concurrency contract.** Routers, controllers, and services are declared
> `async def`, **but every database call is synchronous and is never awaited.**
> `await` is reserved exclusively for WebSocket sends, `asyncio.gather` fan-out,
> and post-commit non-blocking tasks. There is no `AsyncSession` and no
> `await db.execute(...)` anywhere in the data path.

---

## 2. Naming Law

Names are not cosmetic — they are how the layering is read at a glance. The
table is normative.

| Artifact | Convention | Example |
| :--- | :--- | :--- |
| **Table** | plural `snake_case` | `access_grants`, `usage_records` |
| **Model class** | singular `PascalCase` | `AccessGrant`, `UsageRecord` |
| **Model file** | `snake_case.py` | `access_grants.py`, `notification_preference.py` |
| **Service / Controller class** | `PascalCase` + role suffix | `AccessGrantService`, `QuotaController` |
| **Service / Controller file** | mirrors the class — `PascalCase.py` | `AccessGrantService.py` |
| **Route file** | `snake_case.py`, mounted at a REST-style plural path | `access_grants.py` → `/access-grants` |
| **Service package dir** | `snake_case` *(target)* | `access_grant/`, `billing/`, `storage/` |
| **Permission string** | `"domain:action"` | `"campaign:read"`, `"access_grant:create"` |
| **Log tag (service)** | `[Module.method]` prefix | `logger.info(f"[Usage.get] ...")` |
| **Log line (controller)** | fixed phrasing | `logger.error(f"Error in <method> controller: {str(e)}")` |
| **JSONB attribute** | context-prefixed — **never** `metadata` | `usage_metadata`, `grant_metadata` |

> ### ⚠ Known casing drift — converge, do not big-bang
> Service sub-packages currently mix three styles: `accessgrant/` (no
> separator), `Notifications/` (PascalCase), and `billing/` / `storage/`
> (snake). **Target state:** `snake_case` for *package directories*;
> `PascalCase` reserved strictly for `.py` files that contain a `PascalCase`
> class. Rename a package opportunistically *as you already touch it* — never as
> a standalone churn PR. A global rename is a Correctness risk that a Velocity
> win cannot justify.

---

## 3. Critical Wiring Rules

The non-obvious rules. Each exists because violating it has already cost a
production incident or a silent failure.

**① Route registration is centralized.**
New routers are mounted in `routes/api/v0/__init__.py` inside
`register_routes(app)` via
`app.include_router(x.router, prefix=settings.API_V0_STR)`. `main.py` stays
thin. Do not scatter `include_router` calls across modules.

**② Route ordering is load-bearing (FastAPI / Starlette).**
Literal routes must be declared **above** parameterized catch-alls. A
one-segment param route silently swallows every literal sibling declared after
it.
> `GET /roles/company-roles` must precede `GET /roles/{role_id}`.
> The `scope-tree` GET must not sit below `DELETE /{grant_id}`.

**③ Model registration is ordered.**
`app/Models/__init__.py` imports models in dependency order — referenced tables
before the tables that reference them — and lists each in `__all__`.
`Base.metadata.create_all()` creates **missing tables only**; it never alters an
existing one. After any column change, run `alembic upgrade head` *before*
starting uvicorn.

**④ Facades are the only import surface.**
External callers import **only** `EmailService` (from `Email/`) and
`NotificationService` (from `Notifications/`). Reaching into `Dispatcher`,
`Renderer`, `Providers`, `Channels`, or `PreferenceResolver` from outside is a
code smell — every call routes through the facade.

**⑤ There is exactly one WebSocket manager.**
Never instantiate a new `connection_manager` / `event_publisher`. Emit from
business code via the shorthands (`emit_to_company`, `emit_to_user`) **after**
the DB commit, best-effort
(`asyncio.gather(..., return_exceptions=True)`). A failed send is logged, never
raised.

**⑥ `server_default` is not `default`.**
`server_default` is DB-level — the ORM omits the column from INSERT, so a real
DB DEFAULT must exist. `default` is Python-level — the ORM includes the value.
Mismatching the two causes insert crashes. Per-role / per-permission policy
belongs in **seed initializers**, never in migrations.

---

## 4. Feature-Design Gate (Phase 1)

For a genuinely new feature or structural change — *skip for routine CRUD on an
existing pattern* — produce this briefing **in prose, for approval, before any
code is generated.** Four sections, each mandatory:

> **I. Existing-System Regressions.**
> Which tables, shared schemas, background workers, and shared execution paths
> the change touches.
>
> **II. Scalability Reasoning.**
> Query and compute cost at **10×** and **100×** tenant volume; lock
> contention, DB bottlenecks, memory hot-spots. *Surface the risks — do not
> pre-build for them (YAGNI).*
>
> **III. Failure Modes & Fallbacks.**
> Behavior on third-party API loss, network partition, transaction timeout, and
> mid-flight task abort; retry limits, dead-letter storage, rollback boundaries.
>
> **IV. Schema & Migration Imprint.**
> Indexes, unique constraints (including partial `WHERE is_deleted = false`), FK
> `ondelete`, soft-delete columns, backfills. Validate heavy and list queries
> with `EXPLAIN ANALYZE`; **reject any plan showing a sequential scan on a large
> table.**

---

## 5. Pre-Merge Safety Contract

Every code change clears this contract before it is returned. Treat each line as
a gate, not a suggestion.

#### Data integrity
- [ ] **Sync DB** — no awaited queries; `Session` obtained via `Depends(get_db)`.
- [ ] **Soft delete** — `.filter(Model.is_deleted == False)` on *every* read; writes set `is_deleted=True` and stamp `deleted_at`, `deleted_by`.
- [ ] **Money** — `Decimal` + 3-letter ISO currency; never `float`.
- [ ] **Status** — resolved via FK to `statuses`; never a string-enum compare.
- [ ] **JSONB** — no attribute named `metadata`; `flag_modified(obj, "field")` after any in-place mutation.

#### Authorization & tenancy
- [ ] **RBAC** dependency on the route **and** service-layer grant scope with role fallback.
- [ ] **Tenant / agency scoping** applied, including descendants via `parent_company_id`.

#### Concurrency & performance
- [ ] **Row locking** — `.with_for_update()` on the initial SELECT of any shared counter / quota / seat / ledger, mutated inside one transaction.
- [ ] **Quota sentinels** — `-1` unlimited · `NULL` disabled · `0+` explicit. (Legacy `999999` in `UsageService` is a known divergence to converge — not a third encoding.)
- [ ] **No N+1** — eager-load (`selectinload` / `joinedload`) or batch `WHERE id IN (...)`. Every list endpoint is paginated and bounded; counts and sums aggregate in SQL (`func.count`, `func.sum`).
- [ ] **Index-aligned** — filter and sort on indexed columns; match composite leading-column order (grant lookups lead with `principal_type, principal_id`); keep columns sargable (no `func()` / `LOWER()` / casts on indexed columns); align with partial `WHERE is_deleted = false` indexes.

#### Reliability & contracts
- [ ] **Idempotent webhooks** — dedupe on `event_id`; max 3 attempts; never double-apply billing state.
- [ ] **WebSocket emit** — post-commit, best-effort, logged on failure (never raised).
- [ ] **HTTP codes** — 400 / 401 / 403 / 404 / 409; guard clauses first, early returns, shallow indentation.
- [ ] **Error control** — no bare `except`. Services raise `HTTPException` (passes up untouched); controllers re-raise `HTTPException` and wrap the unexpected as a logged 500.

#### Conventions
- [ ] **Pydantic v2** — `model_validate` / `model_dump`; never `from_orm`.
- [ ] **No speculative abstraction** (KISS / YAGNI); style matches the sibling file, documentation conventions included.

---

## 6. Where Things Go — Placement Lookup

| I am adding… | It goes in… |
| :--- | :--- |
| A new endpoint | `routes/api/v0/<domain>.py` (or `<domain>/`), registered in `v0/__init__.py` |
| HTTP try/except + schema mapping | `app/Http/Controllers/<Domain>Controller.py` |
| Business logic / a transaction / a row lock | `app/Services/<domain>/<Domain>Service.py` |
| A new table | `app/Models/<table>.py` + an ordered import in `Models/__init__.py` |
| A request/response shape | `app/Schemas/<domain>.py` (or `<domain>/`) |
| A reusable auth/helper function | `app/Utils/Helpers.py` |
| Seed data (statuses, permissions, role grants) | `app/Utils/dictionaries/` + `db_initialization/` |
| A new email provider | `app/Services/Notifications/Email/Providers/` + one `ProviderFactory` entry + one `EmailProvider` enum value |
| A new notification channel | `app/Services/Notifications/Channels/` (subclass `BaseChannel`) |
| A real-time event handler | `app/WebSocket/events/<domain>.py` |
| An email template | `app/Templates/emails/<group>/<name>.html` + `.txt` |
| A migration | `alembic/versions/` via `alembic revision` — history is immutable; new intent = new revision |

---

<div align="center">

*When in doubt, match the nearest sibling file and resolve conflicts by*
**Correctness › Consistency › Simplicity › Velocity.**

</div>
