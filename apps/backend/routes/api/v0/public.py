# apps/backend/routes/api/v0/public.py
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.FormsController import FormsController
from app.Http.Controllers.PublicController import PublicController
from app.Schemas.forms import BookingCreate, BookingSubmitted, ContactCreate, ContactSubmitted
from app.Schemas.public import LegalPagePublicResponse, ServicePublicListItem, ServicePublicResponse
from app.Utils.i18n import Locale, get_locale
from app.Utils.rate_limit import limiter

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/services", response_model=list[ServicePublicListItem])
async def list_services(response: Response, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> list[ServicePublicListItem]:
    response.headers["Cache-Control"] = "public, max-age=300"
    return PublicController.list_services(db, locale)


@router.get("/services/{slug}", response_model=ServicePublicResponse)
async def get_service(slug: str, response: Response, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> ServicePublicResponse:
    response.headers["Cache-Control"] = "public, max-age=300"
    return PublicController.get_service_by_slug(db, slug, locale)


@router.get("/legal-pages/{slug}", response_model=LegalPagePublicResponse)
async def get_legal_page(slug: str, response: Response, db: Session = Depends(get_db), locale: Locale = Depends(get_locale)) -> LegalPagePublicResponse:
    response.headers["Cache-Control"] = "public, max-age=600"
    return PublicController.get_legal_page(db, slug, locale)


@router.post("/bookings", response_model=BookingSubmitted, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def submit_booking(request: Request, payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> BookingSubmitted:
    return FormsController.submit_booking(db, payload, request, background_tasks)


@router.post("/contact", response_model=ContactSubmitted, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def submit_contact(request: Request, payload: ContactCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> ContactSubmitted:
    return FormsController.submit_contact(db, payload, request, background_tasks)
