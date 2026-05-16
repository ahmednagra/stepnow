// apps/frontend/src/lib/i18n/UiStringsProvider.tsx
// Client-side i18n provider. Now also syncs document.documentElement.lang to the current locale so /en routes get lang="en" without needing to split the root layout (M-7).

"use client";

import { createContext, useEffect, useMemo, type ReactNode } from "react";
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

useEffect(() => {
if (typeof document === "undefined") return;
if (document.documentElement.lang !== locale) {
document.documentElement.lang = locale;
}
}, [locale]);

return <UiStringsContext.Provider value={value}>{children}</UiStringsContext.Provider>;
}
