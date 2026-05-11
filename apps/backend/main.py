# apps/backend/main.py
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from config.settings import settings
from app.Core.Exceptions import AppError
from app.Utils.Logger import get_logger
from app.Utils.rate_limit import limiter
from routes import setup_api_routes

logger = get_logger("stepnow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} (env={settings.ENVIRONMENT})")
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


# Architecture §14: Services raise AppError. These handlers shape the JSON envelope when an exception escapes the middleware.
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.error_code, "message": exc.message, "extra": exc.extra}},
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": {"code": "RATE_LIMITED", "message": "Too many requests", "extra": {}}},
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred", "extra": {}}},
    )


setup_api_routes(app)
