// src/lib/i18n/UiStringsProvider.tsx
// Client-side provider. The server layout fetches strings once and passes them
// in; client components consume via useUiStrings().

"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { Locale, UiStringsMap } from "@/types";
import { createT, type TFunction } from "./t";

interface UiStringsContextValue {
  locale: Locale;
  strings: UiStringsMap;
  t: TFunction;
}

// Exported so the hook in /hooks/useUiStrings.ts can read it.
export const UiStringsContext = createContext<UiStringsContextValue | null>(null);

interface UiStringsProviderProps {
  locale: Locale;
  strings: UiStringsMap;
  children: ReactNode;
}

export function UiStringsProvider({ locale, strings, children }: UiStringsProviderProps) {
  const value = useMemo<UiStringsContextValue>(
    () => ({ locale, strings, t: createT(strings, locale) }),
    [locale, strings],
  );
  return <UiStringsContext.Provider value={value}>{children}</UiStringsContext.Provider>;
}
