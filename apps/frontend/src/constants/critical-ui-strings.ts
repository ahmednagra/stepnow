// src/constants/critical-ui-strings.ts
// Last-resort fallbacks for UI strings that must never be missing.
// If the backend returns no value for these keys, the t() helper falls back to
// the values here. Defense in depth: the backend marks the same keys as
// is_locked=true so they can't be deleted via admin.

import type { Locale } from "@/types";

export const CRITICAL_FALLBACKS: Record<string, Record<Locale, string>> = {
  "language.switch.de": { de: "Deutsch", en: "German" },
  "language.switch.en": { de: "Englisch", en: "English" },
  "common.loading": { de: "Lädt…", en: "Loading…" },
  "common.book_now": { de: "Jetzt buchen", en: "Book now" },
  "common.call_us": { de: "Anrufen", en: "Call us" },
  "errors.generic": {
    de: "Ein Fehler ist aufgetreten.",
    en: "An error occurred.",
  },
  "errors.required": {
    de: "Dieses Feld ist erforderlich.",
    en: "This field is required.",
  },
  "404.heading": { de: "Seite nicht gefunden", en: "Page not found" },
  "404.body": {
    de: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    en: "The page you're looking for doesn't exist or has been moved.",
  },
  "404.cta": { de: "Zur Startseite", en: "Back to homepage" },
};
