// apps/frontend/src/utils/preview-urls.ts
// Centralised helper so URL conventions live in one place.

export type PreviewLocale = "de" | "en";

export function servicePreviewUrl(slugDe: string, slugEn: string, locale: PreviewLocale = "de"): string {
  if (locale === "en") return `/en/services/${slugEn}`;
  return `/dienstleistungen/${slugDe}`;
}

export function vehiclesPreviewUrl(locale: PreviewLocale = "de"): string {
  return locale === "en" ? "/en/vehicles" : "/fahrzeuge";
}

export function testimonialsPreviewUrl(locale: PreviewLocale = "de"): string {
  return locale === "en" ? "/en/testimonials" : "/referenzen";
}

export function faqsPreviewUrl(locale: PreviewLocale = "de"): string {
  return locale === "en" ? "/en/faq" : "/faq";
}

export function pricingPreviewUrl(locale: PreviewLocale = "de"): string {
  return locale === "en" ? "/en/pricing" : "/preise";
}

export function legalPreviewUrl(slug: string, locale: PreviewLocale = "de"): string {
  return locale === "en" ? `/en/legal/${slug}` : `/legal/${slug}`;
}

export function homePreviewUrl(locale: PreviewLocale = "de"): string {
  return locale === "en" ? "/en" : "/";
}
