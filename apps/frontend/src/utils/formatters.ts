// src/utils/formatters.ts
// Locale-aware formatters. Defaults to German formatting since DE is the
// primary locale; explicit locale arg overrides.

import type { Locale } from "@/types";

const LOCALE_MAP: Record<Locale, string> = { de: "de-DE", en: "en-GB" };

/** Format an amount in its stored currency. Intl places the symbol per locale —
 *  "39,00 €" (de) vs "€39.00" (en) — so both languages read natively. */
export function formatPrice(value: string | number, locale: Locale = "de", currency = "EUR"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: "currency",
    currency,
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
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+49") && cleaned.length > 5) {
    const national = cleaned.slice(3);
    // Mobile numbers (01…) group like the printed flyer: "0155 1066 9395" → "+49 155 1066 9395".
    if (national.startsWith("1") && national.length >= 10) {
      return `+49 ${national.slice(0, 3)} ${national.slice(3, 7)} ${national.slice(7)}`;
    }
    return `+49 ${national.slice(0, 3)} ${national.slice(3)}`;
  }
  return cleaned;
}

/** Convert a display phone string into a `tel:` href. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
