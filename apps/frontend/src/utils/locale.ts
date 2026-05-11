// src/utils/locale.ts
import { isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/types";

/** Derive the active locale from a URL pathname. */
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "de";
}

/** Convert an Accept-Language header into a Locale, defaulting to "de". */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "de";
  const primary = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("de")) return "de";
  return "en";
}

export function assertLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : "de";
}
