// src/utils/formatters.ts
// Locale-aware formatters. Defaults to German formatting since DE is the
// primary locale; explicit locale arg overrides.

import type { Locale } from "@/types";

const LOCALE_MAP: Record<Locale, string> = { de: "de-DE", en: "en-GB" };

/** Format a numeric string as a EUR price with the appropriate locale separator. */
export function formatPrice(value: string | number, locale: Locale = "de"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Format an ISO date string ("2026-01-15") as a localized date. */
export function formatDate(isoDate: string | null | undefined, locale: Locale = "de"): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Pretty-print a phone number for display. Keeps the original spacing if the
 * caller already formatted it; otherwise applies a simple German grouping.
 */
export function formatPhone(raw: string): string {
  if (raw.includes(" ") || raw.includes("/")) return raw;
  // Group "+49XXXXXXX" as "+49 XXX XXXXXXX"
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+49") && cleaned.length > 5) {
    return `+49 ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return cleaned;
}

/** Convert a display phone string into a `tel:` href. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
