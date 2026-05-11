# apps/backend/app/Http/Controllers/admin/TestimonialsController.py
import math
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Schemas.admin.testimonials import TestimonialAdminResponse, TestimonialCreate, TestimonialUpdate
from app.Schemas.common import PaginatedResponse, PaginationInfo
from app.Services.TestimonialsService import TestimonialsService


class TestimonialsController:

    @staticmethod
    def list_testimonials(db: Session, page: int, size: int, q: str | None, source: str | None, include_inactive: bool, include_deleted: bool) -> PaginatedResponse[TestimonialAdminResponse]:
        items, total = TestimonialsService.list_testimonials(db, page, size, q, source, include_inactive, include_deleted)
        pages = max(1, math.ceil(total / size)) if total else 0
        return PaginatedResponse[TestimonialAdminResponse](
            items=[TestimonialAdminResponse.model_validate(t) for t in items],
            pagination=PaginationInfo(page=page, size=size, total=total, pages=pages),
        )

    @staticmethod
    def get(db: Session, testimonial_id: UUID) -> TestimonialAdminResponse:
        t = TestimonialsService.get_testimonial(db, testimonial_id, allow_deleted=True)
        return TestimonialAdminResponse.model_validate(t)

    @staticmethod
    def create(db: Session, payload: TestimonialCreate, actor: AdminUser, request: Request) -> TestimonialAdminResponse:
        t = TestimonialsService.create_testimonial(db, payload.model_dump(), actor, request)
        return TestimonialAdminResponse.model_validate(t)

    @staticmethod
    def update(db: Session, testimonial_id: UUID, payload: TestimonialUpdate, actor: AdminUser, request: Request) -> TestimonialAdminResponse:
        data = payload.model_dump(exclude_unset=True)
        t = TestimonialsService.update_testimonial(db, testimonial_id, data, actor, request)
        return TestimonialAdminResponse.model_validate(t)

    @staticmethod
    def delete(db: Session, testimonial_id: UUID, actor: AdminUser, request: Request) -> None:
        TestimonialsService.soft_delete_testimonial(db, testimonial_id, actor, request)

    @staticmethod
    def restore(db: Session, testimonial_id: UUID, actor: AdminUser, request: Request) -> TestimonialAdminResponse:
        t = TestimonialsService.restore_testimonial(db, testimonial_id, actor, request)
        return TestimonialAdminResponse.model_validate(t)
