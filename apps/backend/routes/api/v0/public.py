# apps/backend/routes/api/v0/public.py
# Public endpoints with ETag/304 short-circuiting on read paths. Tightens rate limits on submit_booking and submit_contact: 5/minute -> 3/minute;10/hour. The compound limit (slowapi/limits library: semicolon-separated rules) blocks both burst floods (3/min) and sustained low-rate abuse (10/hour).

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.FormsController import FormsController
from app.Http.Controllers.PublicController import PublicController
from app.Http.Controllers.public.PublicSlipController import PublicSlipController
from app.Schemas.forms import BookingCreate, BookingSubmitted, ContactCreate, ContactSubmitted
from app.Utils.i18n import Locale, get_locale
from app.Utils.rate_limit import limiter

router = APIRouter(prefix="/public", tags=["public"])


def _jsonable(obj: Any) -> Any:
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    if isinstance(obj, list):
        return [_jsonable(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _jsonable(v) for k, v in obj.items()}
    return obj


def _cached(request: Request, payload: Any, max_age: int = 300) -> Response:
    body = json.dumps(_jsonable(payload), separators=(",", ":"), default=str).encode("utf-8")
    etag = '"' + hashlib.md5(body).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": f"public, max-age={max_age}"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/settings")
async def get_settings(request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.get_settings(db, locale))


@router.get("/ui-strings")
async def get_ui_strings(
    request: Request,
    db: Session = Depends(get_db),
    locale: Locale = Depends(get_locale),
    namespace: str | None = Query(None, max_length=100),
) -> Response:
    return _cached(request, PublicController.get_ui_strings(db, locale, namespace))


@router.get("/services")
async def list_services(request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.list_services(db, locale))


@router.get("/services/{slug}")
async def get_service(slug: str, request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.get_service_by_slug(db, slug, locale))


@router.get("/legal-pages/{slug}")
async def get_legal_page(slug: str, request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.get_legal_page(db, slug, locale), max_age=600)


@router.get("/vehicles")
async def list_vehicles(request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.list_vehicles(db, locale))


@router.get("/faqs")
async def list_faqs(
    request: Request,
    db: Session = Depends(get_db),
    locale: Locale = Depends(get_locale),
    category: str | None = Query(None, max_length=50),
) -> Response:
    return _cached(request, PublicController.list_faqs(db, locale, category))


@router.get("/testimonials")
async def list_testimonials(request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.list_testimonials(db, locale))


@router.get("/pricing")
async def list_pricing_all(request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.list_pricing_all_grouped(db, locale))


@router.get("/services/{slug}/pricing")
async def list_pricing(slug: str, request: Request, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> Response:
    return _cached(request, PublicController.list_pricing_for_service(db, slug, locale))


@router.post("/bookings", response_model=BookingSubmitted, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute;10/hour")
async def submit_booking(request: Request, payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> BookingSubmitted:
    return FormsController.submit_booking(db, payload, request, background_tasks)


@router.post("/contact", response_model=ContactSubmitted, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute;10/hour")
async def submit_contact(request: Request, payload: ContactCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> ContactSubmitted:
    return FormsController.submit_contact(db, payload, request, background_tasks)


@router.get("/slips/{public_code}")
async def public_slip_download(
    public_code: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> FileResponse:
    abs_path = PublicSlipController.download(db, public_code, background_tasks)
    return FileResponse(abs_path, media_type="application/pdf", filename=Path(abs_path).name)
