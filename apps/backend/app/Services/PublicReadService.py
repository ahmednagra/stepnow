# apps/backend/app/Services/PublicReadService.py
from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Models.services import Service
from app.Utils.i18n import Locale


class PublicReadService:

    @staticmethod
    def list_services(db: Session, locale: Locale) -> list[Service]:
        return db.query(Service).filter(Service.active == True, Service.is_deleted == False).order_by(Service.sort_order, Service.created_at).all()

    @staticmethod
    def get_service_by_slug(db: Session, slug: str, locale: Locale) -> Service:
        slug_column = Service.slug_de if locale == Locale.DE else Service.slug_en
        svc = db.query(Service).filter(slug_column == slug, Service.active == True, Service.is_deleted == False).first()
        if not svc:
            raise NotFoundError("Service not found", slug=slug, locale=locale.value)
        return svc

    @staticmethod
    def to_public_list_item(svc: Service, locale: Locale) -> dict:
        return {
            "id": svc.id,
            "slug": svc.slug_de if locale == Locale.DE else svc.slug_en,
            "icon": svc.icon,
            "title": svc.title_de if locale == Locale.DE else svc.title_en,
            "short_description": svc.short_description_de if locale == Locale.DE else svc.short_description_en,
            "hero_image_url": svc.hero_image_url,
        }

    @staticmethod
    def to_public_detail(svc: Service, locale: Locale) -> dict:
        is_de = locale == Locale.DE
        return {
            "id": svc.id,
            "slug": svc.slug_de if is_de else svc.slug_en,
            "icon": svc.icon,
            "title": svc.title_de if is_de else svc.title_en,
            "short_description": svc.short_description_de if is_de else svc.short_description_en,
            "long_description": svc.long_description_de if is_de else svc.long_description_en,
            "hero_image_url": svc.hero_image_url,
            "og_image_url": svc.og_image_url,
            "meta_title": svc.meta_title_de if is_de else svc.meta_title_en,
            "meta_description": svc.meta_description_de if is_de else svc.meta_description_en,
        }
