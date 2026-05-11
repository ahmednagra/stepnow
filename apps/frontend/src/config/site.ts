// src/config/site.ts
// Env-level site metadata. Hardcoded; not editable via admin.
// For editable business info (name, phone, address), use the SiteSettings model from /public/settings.

export const SITE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://step-now.de",
  defaultLocale: "de" as const,
  supportedLocales: ["de", "en"] as const,
  cookieLocaleName: "stepnow_locale",
  ogImageDefault: "/images/og-default.jpg",
} as const;

export type SiteLocale = (typeof SITE_CONFIG.supportedLocales)[number];
