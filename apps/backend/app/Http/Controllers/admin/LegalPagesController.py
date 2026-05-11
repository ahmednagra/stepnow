# apps/backend/app/Http/Controllers/admin/LegalPagesController.py
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from app.Models.admin import AdminUser
from app.Models.legal_pages import LegalPage, LegalPageVersion
from app.Schemas.admin.legal_pages import (
    LegalPageAdminResponse,
    LegalPageCreate,
    LegalPageDraftSave,
    LegalPagePreview,
    LegalPagePublish,
    LegalPageRollback,
    LegalPageVersionResponse,
)
from app.Services.LegalPagesService import LegalPagesService


class LegalPagesController:

    @staticmethod
    def list_pages(db: Session, include_deleted: bool) -> list[LegalPageAdminResponse]:
        pages = LegalPagesService.list_pages(db, include_deleted=include_deleted)
        return [LegalPagesController._serialize_page(db, p) for p in pages]

    @staticmethod
    def get(db: Session, slug: str) -> LegalPageAdminResponse:
        page = LegalPagesService.get_page_by_slug(db, slug, allow_deleted=True)
        return LegalPagesController._serialize_page(db, page)

    @staticmethod
    def create(db: Session, payload: LegalPageCreate, actor: AdminUser, request: Request) -> LegalPageAdminResponse:
        page = LegalPagesService.create_page(db, payload.slug, actor, request)
        return LegalPagesController._serialize_page(db, page)

    @staticmethod
    def save_draft(db: Session, slug: str, payload: LegalPageDraftSave, actor: AdminUser, request: Request) -> LegalPageVersionResponse:
        draft = LegalPagesService.save_draft(db, slug, payload.model_dump(), actor, request)
        return LegalPageVersionResponse.model_validate(draft)

    @staticmethod
    def publish(db: Session, slug: str, payload: LegalPagePublish, actor: AdminUser, request: Request) -> LegalPageVersionResponse:
        version = LegalPagesService.publish_draft(db, slug, actor, payload.changes_summary, request)
        return LegalPageVersionResponse.model_validate(version)

    @staticmethod
    def rollback(db: Session, slug: str, payload: LegalPageRollback, actor: AdminUser, request: Request) -> LegalPageVersionResponse:
        version = LegalPagesService.rollback(db, slug, payload.target_version_id, actor, payload.changes_summary, request)
        return LegalPageVersionResponse.model_validate(version)

    @staticmethod
    def list_versions(db: Session, slug: str) -> list[LegalPageVersionResponse]:
        versions = LegalPagesService.list_versions(db, slug)
        return [LegalPageVersionResponse.model_validate(v) for v in versions]

    @staticmethod
    def preview(db: Session, slug: str) -> LegalPagePreview:
        data = LegalPagesService.preview_draft(db, slug)
        return LegalPagePreview(**data)

    @staticmethod
    def _serialize_page(db: Session, page: LegalPage) -> LegalPageAdminResponse:
        published = None
        draft = None
        if page.published_version_id:
            v = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.published_version_id).first()
            if v:
                published = LegalPageVersionResponse.model_validate(v)
        if page.draft_version_id:
            v = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.draft_version_id).first()
            if v:
                draft = LegalPageVersionResponse.model_validate(v)
        return LegalPageAdminResponse(
            id=page.id,
            slug=page.slug,
            published_version_id=page.published_version_id,
            draft_version_id=page.draft_version_id,
            is_deleted=page.is_deleted,
            created_at=page.created_at,
            updated_at=page.updated_at,
            published_version=published,
            draft_version=draft,
        )
