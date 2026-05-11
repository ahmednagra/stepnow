// src/types/index.ts

export type { Pagination, Paginated, ListParams } from "./api";
export type { Locale, UiStringsMap, PublicUiStringsResponse, UiStringAdmin } from "./i18n";
export type { SettingsPublic, SettingsAdmin } from "./settings";
export type { ServicePublic, ServiceAdmin } from "./service";
export type {
  PricingItemPublic,
  PricingCategoryPublic,
  PricingItemAdmin,
  PricingCategoryAdmin,
} from "./pricing";
export type { VehiclePublic, VehicleAdmin } from "./vehicle";
export type { FaqPublic, FaqAdmin } from "./faq";
export type { TestimonialPublic, TestimonialAdmin } from "./testimonial";
export type { LegalPagePublic, LegalPageVersionAdmin, LegalPageAdmin } from "./legalPage";
export type { BookingCreate, BookingSubmitted, BookingAdmin, BookingStatus } from "./booking";
export { BOOKING_STATUSES } from "./booking";
export type {
  ContactCreate,
  ContactSubmitted,
  ContactMessageAdmin,
  ContactCategory,
} from "./contact";
export { CONTACT_CATEGORIES } from "./contact";
export type {
  LoginRequest,
  BackendLoginResponse,
  ClientLoginResponse,
  CurrentAdmin,
} from "./auth";
export type { AuditLogEntry, PaginatedAuditLog } from "./audit-log";
