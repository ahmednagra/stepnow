// apps/frontend/src/app/(public)/buchen/bestaetigung/page.tsx
// Phase 3d polish — German booking confirmation page. Reads ?ref= from the
// URL and renders the premium BookingConfirmation surface.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { BookingConfirmation } from "@/components/features/booking/BookingConfirmation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("booking.confirmation.heading"),
    description: t("booking.confirmation.body"),
    path: "/buchen/bestaetigung",
    locale: "de",
    robots: { index: false, follow: true },
  });
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingConfirmationDe({ searchParams }: PageProps) {
  const sp = await searchParams;
  const settings = await getSettingsServer("de");
  return (
    <BookingConfirmation
      reference={sp.ref ?? null}
      settings={settings}
      homeHref="/"
    />
  );
}
