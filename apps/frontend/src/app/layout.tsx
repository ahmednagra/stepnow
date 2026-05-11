// src/app/layout.tsx
// Root layout. Sets fonts, base html tag, and site-wide metadata

import type { Metadata, Viewport } from "next";
import { cormorant, inter } from "@/lib/fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StepNow Rides & Movers",
    template: "%s · StepNow Rides & Movers",
  },
  description:
    "Vorbestellte Fahrten in der Region Stuttgart. Festpreis. Konzessioniert nach § 49 PBefG.",
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

// In Next.js 14+ `themeColor` lives on `viewport`, not `metadata`.
export const viewport: Viewport = {
  themeColor: "#5a8a2a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}