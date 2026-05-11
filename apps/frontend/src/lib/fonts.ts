// src/lib/fonts.ts
// Self-hosted fonts via next/font/google.
// next/font downloads at build time and serves from our own origin — no
// runtime requests to Google's CDN, so DSGVO-safe.

import { Cormorant_Garamond, Inter } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-serif",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});
