// src/app/(public)/layout.tsx
// German ROOT layout (<html lang="de">, see app/root-document.tsx) — all pages at root (e.g. /,
// /preise, /kontakt). Fetches UI strings + site settings once via RSC and provides them to all children.

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
    default: "StepNow Rides & Movers",
    template: "%s · StepNow Rides & Movers",
  },
  description:
    "Vorbestellte Fahrten und Kurierdienste in Deizisau, Plochingen, Esslingen und Umgebung. Festpreise zum Flughafen und Hauptbahnhof Stuttgart. Personenbeförderung nach § 49 PBefG.",
  openGraph: {
    locale: "de_DE",
    type: "website",
    siteName: "StepNow Rides & Movers",
  },
  alternates: {
    canonical: "/",
    languages: {
      "de-DE": "/",
      "en-GB": "/en",
      "x-default": "/",
    },
  },
};

export default async function PublicLayoutDe({ children }: { children: ReactNode }) {
  const [stringsRes, settings] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
  ]);

  return (
    <RootDocument lang="de">
      <UiStringsProvider locale="de" strings={stringsRes.strings}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow">
          Zum Inhalt springen
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