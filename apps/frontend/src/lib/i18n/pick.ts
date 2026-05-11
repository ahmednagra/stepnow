// apps/frontend/src/lib/i18n/pick.ts
// Helper for the (frequent) pattern of "look up a UI string, fall back to a
// baked-in default when the key isn't seeded yet".
//
// Why this exists:
//   The naive pattern `t("some.key") || "Default"` does NOT work, because
//   the createT helper returns the raw key (a truthy string like
//   "about.story.eyebrow") when the key isn't found in ui_strings. Only an
//   explicit "looks-like-a-key" test catches this.
//
// Use it like:
//   const eyebrow = pickT(t, "about.story.eyebrow", "Die Geschichte");
//
// This file is dependency-free and safe to import from server or client
// components.

import type { TFunction } from "./t";

/** Returns true when the t() result is a real translation, not the key echoed back. */
export function isResolvedString(value: string | null | undefined, key: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === key) return false;
  // Some t() helpers return "[missing]" or "[key]" — also treat as missing.
  if (trimmed.startsWith("[")) return false;
  // Heuristic: a "key-like" string has no whitespace, contains a dot, and uses
  // only alphanumerics, dots, underscores, and hyphens. Real prose always has
  // spaces (German labels like "Über uns", English "About us"), so this is safe.
  if (!/\s/.test(trimmed) && /^[a-z0-9._-]+$/i.test(trimmed) && trimmed.includes(".")) {
    return false;
  }
  return true;
}

/**
 * Look up a UI string by key. If the lookup yields the key itself (i.e. the
 * key isn't seeded yet) or empty, returns the supplied fallback.
 */
export function pickT(t: TFunction, key: string, fallback: string): string {
  const raw = t(key);
  return isResolvedString(raw, key) ? raw : fallback;
}
