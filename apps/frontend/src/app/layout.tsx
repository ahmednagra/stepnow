// src/app/layout.tsx
// Root layout. Sets fonts and a base html tag. The `lang` attribute is
// overridden by the (public) and en/ layouts via setting it on <html> via
// the layout-level template.

import type { Metadata } from "next";
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
