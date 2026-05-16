# apps/backend/app/Http/Controllers/PublicController.py
# Maps SQLAlchemy rows to public Pydantic responses for all /api/v0/public/* endpoints. Adds list_pricing_all_grouped() for the batch /pricing route.

from sqlalchemy.orm import Session
from app.Core.Exceptions import NotFoundError
from app.Schemas.public import (
    FaqPublicResponse, LegalPagePublicResponse, PricingCategoryPublicResponse,
    PricingGroupedByServicePublic, PricingItemPublicResponse, ServicePublicListItem,
    ServicePublicResponse, SettingsPublicResponse, TestimonialPublicResponse,
    UiStringsPublicResponse, VehiclePublicResponse,
)
from app.Services.FaqsService import FaqsService
from app.Services.LegalPagesService import LegalPagesService
from app.Services.PublicReadService import PublicReadService
from app.Services.PricingService import PricingService
from app.Services.SettingsService import SettingsService
from app.Services.TestimonialsService import TestimonialsService
from app.Services.UiStringsService import UiStringsService
from app.Services.VehiclesService import VehiclesService
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

    @staticmethod
    def get_legal_page(db: Session, slug: str, locale: Locale) -> LegalPagePublicResponse:
        return LegalPagePublicResponse(**LegalPagesService.get_published_for_public(db, slug, locale.value))

    @staticmethod
    def get_settings(db: Session, locale: Locale) -> SettingsPublicResponse:
        s = SettingsService.get_or_none(db)
        if not s:
            raise NotFoundError("Site settings not yet initialized")
        is_de = locale == Locale.DE
        return SettingsPublicResponse(
            business_name=s.business_name,
            address_street=s.address_street,
            address_postcode=s.address_postcode,
            address_city=s.address_city,
            address_lat=s.address_lat,
            address_lng=s.address_lng,
            phone=s.phone,
            phone_mobile=s.phone_mobile,
            email=s.email,
            whatsapp_url=s.whatsapp_url,
            opening_hours=s.opening_hours_de if is_de else s.opening_hours_en,
            social_facebook=s.social_facebook,
            social_instagram=s.social_instagram,
            social_youtube=s.social_youtube,
            social_tiktok=s.social_tiktok,
            default_meta_title=s.default_meta_title_de if is_de else s.default_meta_title_en,
            default_og_image_url=s.default_og_image_url,
        )

    @staticmethod
    def get_ui_strings(db: Session, locale: Locale, namespace: str | None) -> UiStringsPublicResponse:
        strings = UiStringsService.bulk_public(db, locale.value, namespace=namespace)
        return UiStringsPublicResponse(locale=locale.value, strings=strings)

    @staticmethod
    def list_vehicles(db: Session, locale: Locale) -> list[VehiclePublicResponse]:
        items = VehiclesService.list_public(db)
        is_de = locale == Locale.DE
        return [VehiclePublicResponse(
            id=v.id,
            name=v.name_de if is_de else v.name_en,
            category=v.category,
            capacity_passengers=v.capacity_passengers,
            capacity_luggage=v.capacity_luggage,
            features=v.features_de if is_de else v.features_en,
            image_url=v.image_url,
        ) for v in items]

    @staticmethod
    def list_faqs(db: Session, locale: Locale, category: str | None) -> list[FaqPublicResponse]:
        items = FaqsService.list_public(db, category)
        is_de = locale == Locale.DE
        return [FaqPublicResponse(
            id=f.id,
            category=f.category,
            question=f.question_de if is_de else f.question_en,
            answer=f.answer_de if is_de else f.answer_en,
        ) for f in items]

    @staticmethod
    def list_testimonials(db: Session, locale: Locale) -> list[TestimonialPublicResponse]:
        items = TestimonialsService.list_public(db)
        is_de = locale == Locale.DE
        return [TestimonialPublicResponse(
            id=t.id,
            author_name=t.author_name,
            author_role=t.author_role_de if is_de else t.author_role_en,
            author_photo_url=t.author_photo_url,
            quote=t.quote_de if is_de else t.quote_en,
            rating=t.rating,
            date_given=t.date_given,
            source=t.source,
        ) for t in items]

    @staticmethod
    def list_pricing_for_service(db: Session, slug: str, locale: Locale) -> list[PricingCategoryPublicResponse]:
        cats = PricingService.list_public_for_service_slug(db, slug, locale.value)
        return [PricingCategoryPublicResponse(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            items=[PricingItemPublicResponse(**i) for i in c["items"]],
        ) for c in cats]

    @staticmethod
    def list_pricing_all_grouped(db: Session, locale: Locale) -> list[PricingGroupedByServicePublic]:
        grouped = PricingService.list_public_all_grouped(db, locale.value)
        return [PricingGroupedByServicePublic(
            service_id=g["service_id"],
            service_slug=g["service_slug"],
            categories=[PricingCategoryPublicResponse(
                id=c["id"],
                name=c["name"],
                description=c["description"],
                items=[PricingItemPublicResponse(**i) for i in c["items"]],
            ) for c in g["categories"]],
        ) for g in grouped]
