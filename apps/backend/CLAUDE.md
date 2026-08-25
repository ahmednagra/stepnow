# StepNow — Backend

FastAPI / SQLAlchemy sync / PostgreSQL. The models ARE the schema — no migration files.
Read the sibling file for the module you're touching before writing anything.

## Stack
| | |
|---|---|
| ORM | SQLAlchemy sync `Session` — never `AsyncSession` |
| Validation | Pydantic v2 — `model_validate` `model_dump` — never `from_orm` |
| Auth | JWT — `Depends(get_current_admin)` — single admin type, no RBAC. 30-min access token, 14-day refresh; the browser client refreshes on 401 and retries once |
| Logging | `from app.Utils.Logger import get_logger; logger = get_logger("module")` |
| Deploy | Hostinger VPS — systemd `stepnow-backend.service` port 8000 |

No RBAC. No quota. No access grants. No multi-tenancy.

---

## Directory

```
apps/backend/
├── main.py                       # app factory, exception handlers, setup_api_routes
├── config/settings.py            # pydantic-settings, env vars
├── config/database.py            # SessionLocal, get_db
├── app/
│   ├── Core/Exceptions.py        # NotFoundError ConflictError AppError
│   ├── Http/Controllers/admin/   # OrdersController DriversController VehiclesController …
│   ├── Models/                   # admin.py orders.py customers.py drivers.py vehicles.py expenses.py
│   ├── Schemas/admin/            # orders_admin.py vehicles.py drivers.py …
│   ├── Services/                 # OrdersService DriversService VehiclesService …
│   ├── Utils/Helpers.py          # get_current_admin decode_access_token
│   ├── Utils/Logger.py           # get_logger(name)
│   ├── WebSocket/manager.py      # connection_manager — admin feed only
│   └── templates/                # driver_slip.txt email templates
└── routes/api/v0/
    ├── __init__.py               # setup_api_routes — register all routers
    └── admin/                    # orders.py drivers.py vehicles.py customers.py expenses.py …
```

---

## Layer Isolation (downward only)

```
Router      →  routing + get_current_admin dep only
Controller  →  try/except + logger + model_validate + schema map
Service     →  business logic + transactions + row locks + raises HTTPException/AppError
Model       →  persistence only
```

---

## Canonical Patterns

**Router:**
```python
@router.get("/admin/vehicles", response_model=PaginatedResponse[VehicleAdminResponse])
async def list_vehicles(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
) -> PaginatedResponse[VehicleAdminResponse]:
    return VehiclesController.list_vehicles(db, page, size, q)
```

**Controller:**
```python
@staticmethod
def create(db: Session, payload: VehicleCreate, actor: AdminUser, request: Request) -> VehicleAdminResponse:
    try:
        obj = VehiclesService.create(db, payload, actor)
        return VehicleAdminResponse.model_validate(obj)
    except (HTTPException, AppError):
        raise
    except Exception as e:
        logger.error(f"Error in create_vehicle controller: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create vehicle.")
```

**Service:**
```python
@staticmethod
def create(db: Session, payload: VehicleCreate, actor: AdminUser) -> Vehicle:
    if db.query(Vehicle).filter(Vehicle.plate == payload.plate, Vehicle.is_deleted == False).first():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Plate already exists.")
    obj = Vehicle(**payload.model_dump(), created_by=actor.id)
    db.add(obj); db.flush(); db.commit(); db.refresh(obj)
    return obj
```

---

## DB Rules

- **Sync only** — `await` only for WebSocket sends and post-commit background tasks.
- **Soft-delete every read:** `.filter(Model.is_deleted == False)`
- **Soft-delete every write:** `obj.is_deleted = True; obj.deleted_at = datetime.utcnow(); db.commit()`
- **Shared counters:** claim via `next_counter(db, scope, key)` — atomic, no read-then-write
- **Kill N+1:** aggregate in SQL, never query inside a loop
- **Sargable:** never `func.lower(col)` on indexed columns
- **All lists:** paginated + bounded — never unbounded `SELECT *`

---

## Naming

| | |
|---|---|
| Tables | plural snake_case: `orders` `vehicles` `customers` |
| Models | singular PascalCase: `Order` `Vehicle` `Customer` |
| Money | `NUMERIC(10,2)` → `Decimal` — never `float`. EUR default. |
| VAT | **DB-owned** — `services.vat_rate`, falling back to `site_settings.vat_rate_standard` (19%) / `vat_rate_reduced` (7%, PBefG). Resolve with `vat_rate_for(db, service_id, service_type)`; never a constant |
| Docs | **Transportauftrag** (driver slip, no price, `A-…`) · **Rechnung** (§14 invoice, `R…`, IBAN/BIC + HRA footer). Issuer/bank/register from `site_settings`. Must match `Refrence Material/Docs/` templates. |
| Kunden-Nr | `customers.customer_number` — K911-series (e.g. `K911053`), generated in `CustomersService.create` |
| Accounts | **Vehicle account = `Order.*` amounts (frozen at create); company account = `Invoice.*` (editable while draft).** Editing a bill never writes order amounts. |
| Invoice lifecycle | `draft` → `issued` → `paid`, or `cancelled` (Storno). `update` is **draft-only** — an issued bill is a Buchungsbeleg (GoBD §§146/147 AO). Correct it with `cancel` + a replacement, which gets `R{order}-{revision}`. |
| Public create | Field workers create orders with NO login via `POST /public/orders`, gated by `site_settings.staff_access_code`; `Order.created_via="public"`. Billing stays admin-only. |
| Delivery status | string: `draft → dispatched → picked_up → delivered` |
| JSONB attrs | never `metadata` — use `order_metadata` etc. |

---

## Pydantic v2

```python
obj  = Schema.model_validate(row)          # ✅
data = req.model_dump(exclude_unset=True)  # ✅
obj  = Schema.from_orm(row)                # ❌
```

After in-place JSONB mutation: `flag_modified(obj, "field")` before `db.commit()`.

---

## Error Control

```python
except (HTTPException, AppError): raise
except Exception as e:
    logger.error(f"Error in <method> controller: {str(e)}")
    raise HTTPException(500, detail="...")
```

Codes: `400` bad input | `401` no token | `403` forbidden | `404` not found | `409` conflict | `410` gone | `500` unexpected. No bare `except:`.

---

## Logging

```python
logger.error(f"Error in create_vehicle controller: {str(e)}")   # controllers
logger.info(f"[Vehicles.create] plate={plate}")                  # services
```

---

## Auth

Single dep on every admin route — no RBAC, no roles:
```python
actor: AdminUser = Depends(get_current_admin)
```

WebSocket: token as `?token=` query param (browsers can't set headers on WS).

---

## Email

```python
from app.Services.Notifications.Email import EmailService
await EmailService.send(mailbox="accounts", to=[email], subject="...", html=html)
```

Mailboxes: `rides` taxi/bookings · `movers` driver slips · `accounts` invoices + system.

---

## Seeding — the real data-setup path

Schema is synced from the models on startup (see "Schema changes" below). Data is loaded by idempotent seeders.

`scripts/seeders/` holds ~20 seeders; `scripts/seed.py` runs them in dependency order. Each `run()` upserts — safe to re-run on a seeded DB.

```bash
python -m scripts.seed              # manual seed / refresh
AUTO_SEED_ON_STARTUP=true           # app-lifespan auto-seed (non-production only)
```

Tests build the schema into the `stepnow_test` PostgreSQL schema and pin `search_path` to it
alone — never add `public` to that path, or `create_all` finds the real tables and the suite
runs against live data. `TEST_DATABASE_URL` points the suite at a separate database instead.

New domain data → add `scripts/seeders/seed_{feature}.py`, register it in `scripts/seed.py` order.

---

## Schema changes — edit the model, restart

There are no migration files. `sync_schema()` in [main.py](main.py) runs on every boot and makes
the database match `Base.metadata`: creates missing tables, **adds missing columns**
(`ALTER TABLE … ADD COLUMN IF NOT EXISTS`), creates missing indexes, and drops a legacy plain
`UNIQUE` once a partial index supersedes it. Additive and idempotent.

- `server_default=` on a new NOT NULL column — existing rows need a value.
- `comment=` on every new column.
- Uniqueness on a soft-deletable column: `live_unique("uq_x_live", "col")` from
  `app/Models/base.py`, never `unique=True`. A plain UNIQUE keeps a soft-deleted row's value
  reserved forever, so the service guard says free and the database says taken — an opaque 500.
- Renaming or dropping a column is the one thing sync cannot do; do it by hand and update the model.

## Sequential numbers

Order numbers, Kunden-Nr. and Rechnungsnummern come from the `counters` table via
`next_counter(db, scope, key)` — one `INSERT … ON CONFLICT DO UPDATE … RETURNING`, so the claim
is atomic and a number is never reissued. Never derive a number from `COUNT(*)` or `MAX()`.
`seed_counters()` aligns the table with existing rows on boot.

---

## New Feature — 6 Steps

```
1. app/Models/{feature}.py
2. app/Schemas/admin/{feature}.py
3. app/Services/{Feature}Service.py
4. app/Http/Controllers/admin/{Feature}Controller.py
5. routes/api/v0/admin/{feature}.py
6. routes/api/v0/__init__.py  ← include_router(...)
```

---

## Checklist

- [ ] No `await db.*`
- [ ] `Depends(get_current_admin)` on every admin route
- [ ] `is_deleted == False` on every read; soft-delete on writes
- [ ] `Decimal` + currency on all money
- [ ] `model_validate` / `model_dump` — no `from_orm`
- [ ] `flag_modified` after JSONB mutation; no attr named `metadata`
- [ ] No queries in loops; all lists paginated
- [ ] Sargable filters; `live_unique` (not `unique=True`) on any soft-deletable column
- [ ] Sequential numbers via `next_counter` — never `COUNT(*)`/`MAX()`
- [ ] No module-level domain constants — rates, statuses and limits come from the DB
- [ ] Style matches the sibling file

---

## Code Style — Compact Always

Every file must be as short as possible while correct.
- No docstrings on CRUD methods. No comments restating the code.
- No blank lines inside functions. Inline single-use variables.
- Chain SQLAlchemy filters: `db.query(Model).filter(A, B, C).first()`
- Ternaries for 2-branch logic. List comprehensions over for+append.
- Keep: per-column `comment=`, logger lines, rationale on non-obvious rules.
