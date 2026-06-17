# apps/backend/app/Models/settings.py
# SQLAlchemy model for the singleton site_settings row (business info + map coords).
from datetime import date
from decimal import Decimal
from sqlalchemy import CheckConstraint, Date, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.Models.base import Base
from app.Mixins.TimestampMixin import TimestampMixin


class SiteSettings(Base, TimestampMixin):
    __tablename__ = "site_settings"
    __table_args__ = (CheckConstraint("id = 1", name="single_row"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_name: Mapped[str] = mapped_column(String(200), nullable=False)
    legal_form: Mapped[str] = mapped_column(String(100), nullable=False, default="Einzelunternehmen")
    address_street: Mapped[str] = mapped_column(String(200), nullable=False)
    address_postcode: Mapped[str] = mapped_column(String(10), nullable=False)
    address_city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_country: Mapped[str] = mapped_column(String(100), nullable=False, default="Deutschland")
    address_lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    address_lng: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    phone_mobile: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    whatsapp_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tax_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vat_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    concession_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    concession_authority: Mapped[str | None] = mapped_column(String(200), nullable=True)
    concession_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    opening_hours_de: Mapped[str | None] = mapped_column(Text, nullable=True)
    opening_hours_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_facebook: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_instagram: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_youtube: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_tiktok: Mapped[str | None] = mapped_column(String(500), nullable=True)
    default_meta_title_de: Mapped[str | None] = mapped_column(String(200), nullable=True)
    default_meta_title_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    default_og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    years_active: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Years in operation — homepage trust signal")
    rides_completed: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Completed-rides counter — homepage trust signal")
    fleet_size: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Vehicles in fleet — homepage trust signal")
    google_rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1), nullable=True, comment="Aggregate Google rating, e.g. 4.9")
    google_review_count: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Google review count shown beside the rating")
