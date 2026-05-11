# apps/backend/app/Http/Controllers/PublicController.py
from sqlalchemy.orm import Session
from app.Schemas.public import ServicePublicListItem, ServicePublicResponse
from app.Services.PublicReadService import PublicReadService
from app.Utils.i18n import Locale


class PublicController:

    @staticmethod
    def list_services(db: Session, locale: Locale) -> list[ServicePublicListItem]:
        services = PublicReadService.list_services(db, locale)
        return [ServicePublicListItem(**PublicReadService.to_public_list_item(s, locale)) for s in services]

    @staticmethod
    def get_service_by_slug(db: Session, slug: str, locale: Locale) -> ServicePublicResponse:
        svc = PublicReadService.get_service_by_slug(db, slug, locale)
        return ServicePublicResponse(**PublicReadService.to_public_detail(svc, locale))
