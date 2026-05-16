// apps/frontend/src/app/en/book/confirmation/page.tsx
// Phase 3d polish — English booking confirmation page mirror.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { BookingConfirmation } from "@/components/features/booking/BookingConfirmation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("booking.confirmation.heading"),
    description: t("booking.confirmation.body"),
    path: "/en/book/confirmation",
    locale: "en",
    noindex: true,
  });
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingConfirmationEn({ searchParams }: PageProps) {
  const sp = await searchParams;
  const settings = await getSettingsServer("en");
  return (
    <BookingConfirmation
      reference={sp.ref ?? null}
      settings={settings}
      homeHref="/en"
    />
  );
}
