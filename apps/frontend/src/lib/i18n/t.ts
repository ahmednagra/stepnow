// src/lib/i18n/t.ts
// Translation helper bound to a UI strings map and locale.
// Used by both server components (via getUiStringsServer + createT) and
// client components (via UiStringsProvider + useUiStrings).

import type { Locale, UiStringsMap } from "@/types";
import { CRITICAL_FALLBACKS } from "@/constants/critical-ui-strings";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

export function createT(strings: UiStringsMap, locale: Locale): TFunction {
  return function t(key, vars) {
    let value = strings[key];

    if (!value && CRITICAL_FALLBACKS[key]) {
      value = CRITICAL_FALLBACKS[key][locale];
    }

    if (!value) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing UI string: ${key} (locale=${locale})`);
      }
      return key;
    }

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  };
}
