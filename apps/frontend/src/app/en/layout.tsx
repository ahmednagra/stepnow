// src/app/en/layout.tsx
// English ROOT layout (<html lang="en">, see app/root-document.tsx) — loaded for all /en/* pages.

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";
import { Header, Footer } from "@/components/shared";
import { ConsentBanner, ConsentHydrator } from "@/components/consent";
import { RootDocument, ROOT_VIEWPORT, SHARED_ROOT_METADATA } from "../root-document";

export const viewport = ROOT_VIEWPORT;

export const metadata: Metadata = {
  ...SHARED_ROOT_METADATA,
  title: {
    default: "StepNow Rides & Movers — The alternative to the taxi",
    template: "%s · StepNow Rides & Movers",
  },
  description:
    "Pre-booked rides and courier services in Deizisau, Plochingen, Esslingen and the region. Fixed prices to Stuttgart Airport and Central Station. Licensed under § 49 PBefG.",
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
    <RootDocument lang="en">
      <UiStringsProvider locale="en" strings={stringsRes.strings}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow">
          Skip to main content
        </a>
        <Header settings={settings} />
        <main id="main">{children}</main>
        <Footer settings={settings} />
        <ConsentHydrator />
        <ConsentBanner />
      </UiStringsProvider>
    </RootDocument>
  );
}
