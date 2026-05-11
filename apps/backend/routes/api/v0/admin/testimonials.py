# apps/backend/routes/api/v0/admin/testimonials.py
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from config.database import get_db
from app.Http.Controllers.admin.TestimonialsController import TestimonialsController
from app.Models.admin import AdminUser
from app.Schemas.admin.testimonials import TestimonialAdminResponse, TestimonialCreate, TestimonialUpdate
from app.Schemas.common import PaginatedResponse
from app.Utils.Helpers import get_current_admin

router = APIRouter(prefix="/admin/testimonials", tags=["admin: testimonials"])


@router.get("", response_model=PaginatedResponse[TestimonialAdminResponse])
async def list_testimonials(
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=200),
    source: str | None = Query(None, max_length=50),
    include_inactive: bool = Query(True),
    include_deleted: bool = Query(False),
) -> PaginatedResponse[TestimonialAdminResponse]:
    return TestimonialsController.list_testimonials(db, page, size, q, source, include_inactive, include_deleted)


@router.get("/{testimonial_id}", response_model=TestimonialAdminResponse)
async def get_testimonial(testimonial_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> TestimonialAdminResponse:
    return TestimonialsController.get(db, testimonial_id)


@router.post("", response_model=TestimonialAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_testimonial(request: Request, payload: TestimonialCreate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> TestimonialAdminResponse:
    return TestimonialsController.create(db, payload, actor, request)


@router.patch("/{testimonial_id}", response_model=TestimonialAdminResponse)
async def update_testimonial(request: Request, testimonial_id: UUID, payload: TestimonialUpdate, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> TestimonialAdminResponse:
    return TestimonialsController.update(db, testimonial_id, payload, actor, request)


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(request: Request, testimonial_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> None:
    TestimonialsController.delete(db, testimonial_id, actor, request)


@router.post("/{testimonial_id}/restore", response_model=TestimonialAdminResponse)
async def restore_testimonial(request: Request, testimonial_id: UUID, db: Session = Depends(get_db), actor: AdminUser = Depends(get_current_admin)) -> TestimonialAdminResponse:
    return TestimonialsController.restore(db, testimonial_id, actor, request)
