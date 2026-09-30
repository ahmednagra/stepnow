// apps/frontend/src/lib/i18n/UiStringsProvider.tsx
// Client-side i18n provider. <html lang> is rendered server-side by the DE/EN root layouts (see app/root-document.tsx).

"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { Locale, UiStringsMap } from "@/types";
import { createT, type TFunction } from "./t";

interface UiStringsContextValue {
locale: Locale;
strings: UiStringsMap;
t: TFunction;
}

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
