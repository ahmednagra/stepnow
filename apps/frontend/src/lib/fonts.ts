// apps/frontend/src/lib/fonts.ts

import { Inter, Playfair_Display } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-serif",
});

// Re-exported under the previous name so existing imports of `cormorant`
// don't break in the root layout. The CSS variable name is unchanged.
export const cormorant = playfair;

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});
