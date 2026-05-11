// src/app/(public)/layout.tsx
// German public layout — loaded for all pages at root (e.g. /, /preise, /kontakt).
// Fetches UI strings + site settings once via RSC and provides them to all children.

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";
import { Header, Footer } from "@/components/shared";

// Locale-specific OpenGraph metadata. Favicons are inherited from the
// root layout (src/app/layout.tsx) — don't redeclare them here.
export const metadata: Metadata = {
  openGraph: {
    locale: "de_DE",
    type: "website",
    siteName: "StepNow Rides & Movers",
  },
  alternates: {
    canonical: "/",
    languages: {
      "de-DE": "/",
      "en-US": "/en",
    },
  },
};

export default async function PublicLayoutDe({ children }: { children: ReactNode }) {
  const [stringsRes, settings] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
  ]);

  return (
    <UiStringsProvider locale="de" strings={stringsRes.strings}>
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </UiStringsProvider>
  );
}