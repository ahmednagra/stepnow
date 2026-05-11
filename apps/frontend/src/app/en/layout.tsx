// src/app/en/layout.tsx
// English public layout — loaded for all /en/* pages.

import type { ReactNode } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";
import { Header, Footer } from "@/components/shared";

export default async function PublicLayoutEn({ children }: { children: ReactNode }) {
  const [stringsRes, settings] = await Promise.all([
    getUiStringsServer("en"),
    getSettingsServer("en"),
  ]);

  return (
    <UiStringsProvider locale="en" strings={stringsRes.strings}>
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </UiStringsProvider>
  );
}
