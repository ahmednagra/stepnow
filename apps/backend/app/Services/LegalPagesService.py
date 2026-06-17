# apps/backend/app/Services/LegalPagesService.py
import re
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.Core.Exceptions import ConflictError, DomainError, NotFoundError
from app.Core.ProtectedFields import LEGAL_PAGE_ALLOWED_PLACEHOLDERS
from app.Models.admin import AdminUser
from app.Models.legal_pages import LegalPage, LegalPageVersion
from app.Services.AuditService import AuditService
from app.Services.SettingsService import SettingsService

_PLACEHOLDER_RE = re.compile(r"\{([a-z_]+\.[a-z_]+)\}")


class LegalPagesService:

    @staticmethod
    def list_pages(db: Session, include_deleted: bool = False) -> list[LegalPage]:
        query = db.query(LegalPage)
        if not include_deleted:
            query = query.filter(LegalPage.is_deleted == False)
        return query.order_by(LegalPage.slug).all()

    @staticmethod
    def get_page_by_slug(db: Session, slug: str, allow_deleted: bool = False) -> LegalPage:
        query = db.query(LegalPage).filter(LegalPage.slug == slug)
        if not allow_deleted:
            query = query.filter(LegalPage.is_deleted == False)
        page = query.first()
        if not page:
            raise NotFoundError("Legal page not found", slug=slug)
        return page

    @staticmethod
    def create_page(db: Session, slug: str, actor: AdminUser, request: Request | None = None) -> LegalPage:
        if db.query(LegalPage).filter(LegalPage.slug == slug, LegalPage.is_deleted == False).first():
            raise ConflictError("Legal page with this slug already exists", slug=slug)
        page = LegalPage(slug=slug)
        db.add(page)
        db.flush()
        AuditService.log(db, actor, "legal_pages", str(page.id), "create", None, {"slug": slug}, request)
        db.commit()
        db.refresh(page)
        return page

    @staticmethod
    def save_draft(db: Session, slug: str, data: dict[str, Any], actor: AdminUser, request: Request | None = None) -> LegalPageVersion:
        page = LegalPagesService.get_page_by_slug(db, slug)
        LegalPagesService._validate_placeholders(data["body_de"])
        LegalPagesService._validate_placeholders(data["body_en"])
        existing_draft = None
        if page.draft_version_id:
            existing_draft = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.draft_version_id).first()
        if existing_draft and not existing_draft.is_published:
            before = {"title_de": existing_draft.title_de, "title_en": existing_draft.title_en, "body_de": existing_draft.body_de, "body_en": existing_draft.body_en, "changes_summary": existing_draft.changes_summary}
            existing_draft.title_de = data["title_de"]
            existing_draft.title_en = data["title_en"]
            existing_draft.body_de = data["body_de"]
            existing_draft.body_en = data["body_en"]
            existing_draft.changes_summary = data.get("changes_summary")
            after = {"title_de": existing_draft.title_de, "title_en": existing_draft.title_en, "body_de": existing_draft.body_de, "body_en": existing_draft.body_en, "changes_summary": existing_draft.changes_summary}
            AuditService.log(db, actor, "legal_page_versions", str(existing_draft.id), "draft_update", before, after, request)
            db.commit()
            db.refresh(existing_draft)
            return existing_draft
        next_version = (db.query(func.max(LegalPageVersion.version_number)).filter(LegalPageVersion.legal_page_id == page.id).scalar() or 0) + 1
        draft = LegalPageVersion(
            legal_page_id=page.id,
            version_number=next_version,
            title_de=data["title_de"],
            title_en=data["title_en"],
            body_de=data["body_de"],
            body_en=data["body_en"],
            is_published=False,
            created_by=actor.id,
            changes_summary=data.get("changes_summary"),
        )
        db.add(draft)
        db.flush()
        page.draft_version_id = draft.id
        AuditService.log(db, actor, "legal_page_versions", str(draft.id), "draft_create", None, {"version_number": next_version, "legal_page_slug": slug}, request)
        db.commit()
        db.refresh(draft)
        return draft

    @staticmethod
    def publish_draft(db: Session, slug: str, actor: AdminUser, changes_summary: str | None, request: Request | None = None) -> LegalPageVersion:
        page = LegalPagesService.get_page_by_slug(db, slug)
        if not page.draft_version_id:
            raise DomainError("No draft to publish", slug=slug)
        draft = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.draft_version_id).first()
        if not draft:
            raise NotFoundError("Draft version not found", draft_id=str(page.draft_version_id))
        if draft.is_published:
            raise ConflictError("Draft is already published", version_id=str(draft.id))
        previous_published_id = page.published_version_id
        draft.is_published = True
        draft.published_at = datetime.now(timezone.utc)
        if changes_summary:
            draft.changes_summary = changes_summary
        page.published_version_id = draft.id
        page.draft_version_id = None
        AuditService.log(db, actor, "legal_page_versions", str(draft.id), "publish", {"published_version_id": str(previous_published_id) if previous_published_id else None}, {"published_version_id": str(draft.id), "version_number": draft.version_number, "slug": slug}, request)
        db.commit()
        db.refresh(draft)
        return draft

    @staticmethod
    def rollback(db: Session, slug: str, target_version_id: UUID, actor: AdminUser, changes_summary: str | None, request: Request | None = None) -> LegalPageVersion:
        page = LegalPagesService.get_page_by_slug(db, slug)
        target = db.query(LegalPageVersion).filter(LegalPageVersion.id == target_version_id, LegalPageVersion.legal_page_id == page.id).first()
        if not target:
            raise NotFoundError("Target version not found for this legal page", version_id=str(target_version_id), slug=slug)
        if target.id == page.published_version_id:
            raise ConflictError("Target version is already the current published version", version_id=str(target.id))
        next_version = (db.query(func.max(LegalPageVersion.version_number)).filter(LegalPageVersion.legal_page_id == page.id).scalar() or 0) + 1
        new_version = LegalPageVersion(
            legal_page_id=page.id,
            version_number=next_version,
            title_de=target.title_de,
            title_en=target.title_en,
            body_de=target.body_de,
            body_en=target.body_en,
            is_published=True,
            published_at=datetime.now(timezone.utc),
            created_by=actor.id,
            changes_summary=changes_summary or f"Rollback to v{target.version_number}",
        )
        db.add(new_version)
        db.flush()
        previous_published_id = page.published_version_id
        page.published_version_id = new_version.id
        AuditService.log(db, actor, "legal_page_versions", str(new_version.id), "rollback", {"previous_published_id": str(previous_published_id) if previous_published_id else None}, {"rolled_back_to_version": target.version_number, "new_version_number": next_version, "slug": slug}, request)
        db.commit()
        db.refresh(new_version)
        return new_version

    @staticmethod
    def list_versions(db: Session, slug: str) -> list[LegalPageVersion]:
        page = LegalPagesService.get_page_by_slug(db, slug, allow_deleted=True)
        return db.query(LegalPageVersion).filter(LegalPageVersion.legal_page_id == page.id).order_by(LegalPageVersion.version_number.desc()).all()

    @staticmethod
    def preview_draft(db: Session, slug: str) -> dict[str, Any]:
        page = LegalPagesService.get_page_by_slug(db, slug)
        source = None
        if page.draft_version_id:
            source = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.draft_version_id).first()
        elif page.published_version_id:
            source = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.published_version_id).first()
        if not source:
            raise NotFoundError("No draft or published version exists to preview", slug=slug)
        values = SettingsService.get_placeholder_values(db)
        rendered_de, used_de, unresolved_de = LegalPagesService._render(source.body_de, values)
        rendered_en, used_en, unresolved_en = LegalPagesService._render(source.body_en, values)
        return {
            "title_de": source.title_de,
            "title_en": source.title_en,
            "body_de": rendered_de,
            "body_en": rendered_en,
            "placeholders_used": sorted(set(used_de) | set(used_en)),
            "placeholders_unresolved": sorted(set(unresolved_de) | set(unresolved_en)),
        }

    @staticmethod
    def get_published_for_public(db: Session, slug: str, locale_value: str) -> dict[str, Any]:
        page = db.query(LegalPage).filter(LegalPage.slug == slug, LegalPage.is_deleted == False).first()
        if not page or not page.published_version_id:
            raise NotFoundError("Published legal page not found", slug=slug)
        version = db.query(LegalPageVersion).filter(LegalPageVersion.id == page.published_version_id).first()
        if not version:
            raise NotFoundError("Published version missing for legal page", slug=slug)
        values = SettingsService.get_placeholder_values(db)
        body = version.body_de if locale_value == "de" else version.body_en
        title = version.title_de if locale_value == "de" else version.title_en
        rendered, _, _ = LegalPagesService._render(body, values)
        return {"slug": slug, "title": title, "body": rendered, "published_at": version.published_at, "version_number": version.version_number}

    @staticmethod
    def _validate_placeholders(text: str) -> None:
        found = _PLACEHOLDER_RE.findall(text)
        bad = [p for p in found if p not in LEGAL_PAGE_ALLOWED_PLACEHOLDERS]
        if bad:
            raise DomainError(f"Unknown placeholders in body: {', '.join(sorted(set(bad)))}", unknown_placeholders=sorted(set(bad)))

    @staticmethod
    def _render(text: str, values: dict[str, str]) -> tuple[str, list[str], list[str]]:
        used: list[str] = []
        unresolved: list[str] = []
        def repl(m: re.Match) -> str:
            key = m.group(1)
            if key in values and values[key]:
                used.append(key)
                return values[key]
            unresolved.append(key)
            return m.group(0)
        rendered = _PLACEHOLDER_RE.sub(repl, text)
        return rendered, used, unresolved
