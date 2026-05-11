// src/hooks/useUiStrings.ts
"use client";

import { useContext } from "react";
import { UiStringsContext } from "@/lib/i18n/UiStringsProvider";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale } from "@/types";

interface UseUiStringsResult {
  t: TFunction;
  locale: Locale;
}

/**
 * Access UI strings + translation helper from any client component.
 * Throws if used outside a UiStringsProvider — that's a bug, not a runtime case.
 */
export function useUiStrings(): UseUiStringsResult {
  const ctx = useContext(UiStringsContext);
  if (!ctx) {
    throw new Error("useUiStrings must be used inside a <UiStringsProvider>");
  }
  return { t: ctx.t, locale: ctx.locale };
}
