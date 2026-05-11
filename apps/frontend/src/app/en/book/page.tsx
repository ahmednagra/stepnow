// src/app/en/book/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { WizardShell } from "@/components/features/booking";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("booking.page.title"),
    description: t("booking.page.subhead"),
    path: "/en/book",
    locale: "en",
    noindex: false,
  });
}

export default async function BookingPageEn() {
  const services = await listServicesServer("en");

  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <WizardShell
        locale="en"
        services={services}
        confirmationPath="/en/book/confirmation"
      />
    </Suspense>
  );
}
