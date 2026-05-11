// src/app/(public)/buchen/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { WizardShell } from "@/components/features/booking";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("booking.page.title"),
    description: t("booking.page.subhead"),
    path: "/buchen",
    locale: "de",
    noindex: false,
  });
}

export default async function BookingPageDe() {
  // Services come from the server; strings are read in WizardShell via
  // useUiStrings (from UiStringsProvider). Functions cannot be passed from
  // server components to client components in Next 14, so the t prop is
  // intentionally not forwarded.
  const services = await listServicesServer("de");

  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <WizardShell
        locale="de"
        services={services}
        confirmationPath="/buchen/bestaetigung"
      />
    </Suspense>
  );
}
