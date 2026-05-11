// src/lib/i18n/config.ts
import type { Locale } from "@/types";

export const DEFAULT_LOCALE: Locale = "de";
export const LOCALES: readonly Locale[] = ["de", "en"] as const;
export const LOCALE_COOKIE_NAME = "stepnow_locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "de" || value === "en";
}
