# apps/backend/main.py
# FastAPI app factory: lifespan syncs the schema to the models and (opt-in) runs idempotent seeders; CORS + rate-limit middleware; centralized error envelope.

import time
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy import inspect, text
from sqlalchemy.schema import CreateIndex
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from config.settings import settings
from config.database import engine
from app.Models import Base
from app.Core.Exceptions import AppError
from app.Utils.Logger import get_logger
from app.Utils.rate_limit import limiter
from routes import setup_api_routes

logger = get_logger("stepnow")

# Belt-and-suspenders: ensure auto-seed runs at most once per Python process even if lifespan ever fires twice.
_seeded_this_process: bool = False


def _missing_columns(inspector, table) -> list:
    existing = {c["name"] for c in inspector.get_columns(table.name)}
    return [c for c in table.columns if c.name not in existing]


def _add_column(conn, table, column) -> None:
    ddl = column.type.compile(dialect=conn.dialect)
    default = ""
    if column.server_default is not None and getattr(column.server_default, "arg", None) is not None:
        default = f" DEFAULT {column.server_default.arg.text if hasattr(column.server_default.arg, 'text') else column.server_default.arg}"
    conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN IF NOT EXISTS "{column.name}" {ddl}{default}'))
    # A server_default backfills existing rows, so NOT NULL can be applied straight after —
    # without it the database stays nullable while the model claims otherwise.
    if not column.nullable and default:
        conn.execute(text(f'ALTER TABLE {table.name} ALTER COLUMN "{column.name}" SET NOT NULL'))


def _existing_index_names(inspector, table_name) -> set:
    names = {i["name"] for i in inspector.get_indexes(table_name)}
    names |= {c["name"] for c in inspector.get_unique_constraints(table_name)}
    return {n for n in names if n}


def _fk_target_columns(conn, table_name) -> set:
    """Columns another table's FK points at. Postgres backs such an FK with the unique index on
    the target, and a partial index cannot satisfy it — so these must keep their plain UNIQUE."""
    return {
        row[0]
        for row in conn.execute(
            text("""
                select a.attname
                from pg_constraint con
                join pg_class tgt on tgt.oid = con.confrelid
                join unnest(con.confkey) k on true
                join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k
                where con.contype = 'f' and tgt.relname = :t
            """),
            {"t": table_name},
        )
    }


def _supersede_legacy_uniques(conn, inspector, table) -> int:
    """A column now covered by a partial unique index must lose its plain UNIQUE, otherwise the
    deleted-row value stays reserved and the service-layer guard and the database disagree."""
    covered = {list(i.columns)[0].name for i in table.indexes
               if i.unique and i.dialect_options["postgresql"].get("where") is not None and len(i.columns) == 1}
    covered -= _fk_target_columns(conn, table.name)
    if not covered:
        return 0
    dropped = 0
    for uc in inspector.get_unique_constraints(table.name):
        cols = set(uc.get("column_names") or [])
        if len(cols) == 1 and cols <= covered:
            conn.execute(text(f'ALTER TABLE {table.name} DROP CONSTRAINT IF EXISTS "{uc["name"]}"'))
            dropped += 1
    for ix in inspector.get_indexes(table.name):
        if not ix.get("unique"):
            continue
        cols = set(c for c in (ix.get("column_names") or []) if c)
        model_index = next((i for i in table.indexes if i.name == ix["name"]), None)
        is_partial_in_model = model_index is not None and model_index.dialect_options["postgresql"].get("where") is not None
        if len(cols) == 1 and cols <= covered and not is_partial_in_model:
            conn.execute(text(f'DROP INDEX IF EXISTS "{ix["name"]}"'))
            dropped += 1
    return dropped


def sync_schema() -> None:
    added_columns = created_indexes = dropped_uniques = 0
    with engine.begin() as conn:
        before = set(inspect(conn).get_table_names())
        Base.metadata.create_all(bind=conn, checkfirst=True)
        inspector = inspect(conn)
        present = set(inspector.get_table_names())
        created_tables = len(present - before)

        for table in Base.metadata.sorted_tables:
            if table.name not in present:
                continue
            for column in _missing_columns(inspector, table):
                _add_column(conn, table, column)
                added_columns += 1
                logger.info(f"[Schema] {table.name}.{column.name} added")

        inspector = inspect(conn)
        for table in Base.metadata.sorted_tables:
            if table.name not in set(inspector.get_table_names()):
                continue
            dropped_uniques += _supersede_legacy_uniques(conn, inspector, table)

        inspector = inspect(conn)
        for table in Base.metadata.sorted_tables:
            if table.name not in set(inspector.get_table_names()):
                continue
            existing = _existing_index_names(inspector, table.name)
            for index in table.indexes:
                if index.name in existing:
                    continue
                conn.execute(CreateIndex(index, if_not_exists=True))
                created_indexes += 1
                logger.info(f"[Schema] index {index.name} created")

    logger.info(
        f"[Schema] in sync — {len(Base.metadata.tables)} table(s); "
        f"+{created_tables} table(s), +{added_columns} column(s), +{created_indexes} index(es), -{dropped_uniques} legacy unique(s)"
    )


def seed_counters() -> None:
    """Adopt the highest number already issued so a counter never reissues an existing
    order number, Kunden-Nr. or Rechnungsnummer. Idempotent — only ever raises a counter."""
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO counters (scope, "key", value)
            SELECT 'order', right(order_number, 6),
                   MAX(CAST(regexp_replace(left(order_number, length(order_number) - 6), '^[A-Za-z]+', '') AS bigint))
            FROM orders
            WHERE order_number ~ '^[A-Za-z]*[0-9]{7,}$'
            GROUP BY right(order_number, 6)
            ON CONFLICT (scope, "key") DO UPDATE SET value = GREATEST(counters.value, EXCLUDED.value)
        """))
        conn.execute(text("""
            INSERT INTO counters (scope, "key", value)
            SELECT 'customer', 'K911', MAX(CAST(substring(customer_number from 5) AS bigint))
            FROM customers
            WHERE customer_number ~ '^K911[0-9]+$'
            ON CONFLICT (scope, "key") DO UPDATE SET value = GREATEST(counters.value, EXCLUDED.value)
        """))
        conn.execute(text("""
            INSERT INTO counters (scope, "key", value)
            SELECT 'invoice', o.order_number, COUNT(i.id)
            FROM invoices i JOIN orders o ON o.id = i.order_id
            GROUP BY o.order_number
            ON CONFLICT (scope, "key") DO UPDATE SET value = GREATEST(counters.value, EXCLUDED.value)
        """))
    logger.info("[Schema] counters aligned with existing numbers")


def _run_seeders_if_enabled() -> None:
    # Opt-in via AUTO_SEED_ON_STARTUP=true. Hard-refused in production; per-process guarded; failure is logged but never blocks API startup.
    global _seeded_this_process
    if not settings.AUTO_SEED_ON_STARTUP:
        return
    if settings.ENVIRONMENT == "production":
        logger.warning("AUTO_SEED_ON_STARTUP=true IGNORED because ENVIRONMENT=production. Seeders must never run on a production server.")
        return
    if _seeded_this_process:
        logger.debug("Auto-seed already ran in this process — skipping")
        return
    logger.info("AUTO_SEED_ON_STARTUP=true — running idempotent seeders")
    try:
        from scripts.seed import run_all
        failures = run_all()
        if failures:
            logger.warning(f"Auto-seed completed with {len(failures)} failing seeder(s): {', '.join(failures)}. API startup continues.")
        else:
            logger.info("Auto-seed completed successfully")
    except Exception:
        logger.exception("Auto-seed failed — continuing startup anyway")
    finally:
        _seeded_this_process = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} (env={settings.ENVIRONMENT})")
    sync_schema()
    seed_counters()
    _run_seeders_if_enabled()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/api/v0/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    openapi_url="/api/v0/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Accept-Language"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    start = time.perf_counter()
    client_ip = request.client.host if request.client else "-"
    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms) ip={client_ip}")
        return response
    except Exception as exc:
        duration_ms = (time.perf_counter() - start) * 1000
        if isinstance(exc, AppError):
            logger.warning(f"AppError {exc.error_code} on {request.method} {request.url.path}: {exc.message} ({duration_ms:.1f}ms)")
            return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.error_code, "message": exc.message, "extra": exc.extra}})
        if isinstance(exc, RateLimitExceeded):
            logger.warning(f"RateLimited on {request.method} {request.url.path} ({duration_ms:.1f}ms)")
            return JSONResponse(status_code=429, content={"error": {"code": "RATE_LIMITED", "message": "Too many requests", "extra": {}}})
        logger.exception(f"Unhandled {request.method} {request.url.path} ({duration_ms:.1f}ms)")
        return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred", "extra": {}}})


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.error_code, "message": exc.message, "extra": exc.extra}})


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=jsonable_encoder({"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "extra": {"errors": exc.errors()}}}))


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"error": {"code": "RATE_LIMITED", "message": "Too many requests", "extra": {}}})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred", "extra": {}}})


setup_api_routes(app)

# Mount /uploads for dev; in production nginx serves UPLOAD_DIR directly.
if settings.ENVIRONMENT != "production":
    _upload_path = Path(settings.UPLOAD_DIR).resolve()
    _upload_path.mkdir(parents=True, exist_ok=True)
    app.mount(settings.UPLOAD_PUBLIC_URL_PREFIX, StaticFiles(directory=str(_upload_path)), name="uploads")
