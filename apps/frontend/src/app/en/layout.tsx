// src/app/en/layout.tsx
// English public layout — loaded for all /en/* pages.

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";
import { Header, Footer } from "@/components/shared";

// Locale-specific OpenGraph metadata. Favicons are inherited from the
// root layout (src/app/layout.tsx) — don't redeclare them here.
export const metadata: Metadata = {
  title: {
    default: "StepNow Rides & Movers Taxi Alternative in Stuttgart",
    template: "%s · StepNow Rides & Movers",
  },
  description:
    "Pre-booked transfers in the Plochingen/Esslingen. Fixed prices. Licensed under § 49 PBefG.",
  openGraph: {
    locale: "en_GB",
    type: "website",
    siteName: "StepNow Rides & Movers",
  },
  alternates: {
    canonical: "/en",
    languages: {
      "de-DE": "/",
      "en-GB": "/en",
      "x-default": "/",
    },
  },
};

export default async function PublicLayoutEn({ children }: { children: ReactNode }) {
  const [stringsRes, settings] = await Promise.all([
    getUiStringsServer("en"),
    getSettingsServer("en"),
  ]);

  return (
    <UiStringsProvider locale="en" strings={stringsRes.strings}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow">
        Skip to main content
      </a>
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </UiStringsProvider>
  );
}
