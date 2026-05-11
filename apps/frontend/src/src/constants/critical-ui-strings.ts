// src/constants/critical-ui-strings.ts
// Last-resort fallbacks for UI strings that must never be missing.
// The backend marks the same keys as is_locked=true so they can't be deleted via admin.

import type { Locale } from "@/types";

export const CRITICAL_FALLBACKS: Record<string, Record<Locale, string>> = {
  // Language switcher
  "language.switch.de": { de: "Deutsch", en: "German" },
  "language.switch.en": { de: "Englisch", en: "English" },
  "language.switch.current": { de: "Sprache wählen", en: "Choose language" },

  // Common
  "common.loading": { de: "Lädt…", en: "Loading…" },
  "common.book_now": { de: "Jetzt buchen", en: "Book now" },
  "common.call_us": { de: "Anrufen", en: "Call us" },

  // Errors
  "errors.generic": {
    de: "Ein Fehler ist aufgetreten.",
    en: "An error occurred.",
  },
  "errors.required": {
    de: "Dieses Feld ist erforderlich.",
    en: "This field is required.",
  },

  // 404
  "404.heading": { de: "Seite nicht gefunden", en: "Page not found" },
  "404.body": {
    de: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    en: "The page you're looking for doesn't exist or has been moved.",
  },
  "404.cta": { de: "Zur Startseite", en: "Back to homepage" },

  // Home hero/section pre-headings — Phase 3c additions
  "home.services.pre_heading": {
    de: "UNSERE LEISTUNGEN",
    en: "OUR SERVICES",
  },
  "home.final_cta.pre_heading": {
    de: "BEREIT FÜR IHRE FAHRT",
    en: "READY FOR YOUR RIDE",
  },
};
