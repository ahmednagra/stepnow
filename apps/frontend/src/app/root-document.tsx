// src/app/root-document.tsx
// The <html> shell shared by the app's three ROOT layouts — (public)/layout.tsx (lang="de"),
// en/layout.tsx and admin/layout.tsx (lang="en"). There is deliberately no app/layout.tsx: with one
// root layout the server could only learn the locale from headers()/cookies(), which would make
// every page dynamic and kill ISR. Separate roots put the right lang in the static HTML.
// Consequences: navigating between roots (DE ↔ EN, site ↔ admin) is a full page load, and each
// root owns its not-found/error/loading files (a boundary above a root layout would render
// without <html>). Unmatched URLs reach the localized 404 through the [...notFound] catch-alls.

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import type { Locale } from "@/types";
import { cormorant, inter } from "@/lib/fonts";
import { Providers } from "./providers";
import "./globals.css";

/** Metadata every root layout spreads into its own. */
export const SHARED_ROOT_METADATA: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://step-now.de"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

// In Next.js 14+ `themeColor` lives on `viewport`, not `metadata`. Matches the gold-deep brand token.
export const ROOT_VIEWPORT: Viewport = {
  themeColor: "#6E5430",
};

export function RootDocument({ lang, children }: { lang: Locale; children: ReactNode }) {
  return (
    <html lang={lang} className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
