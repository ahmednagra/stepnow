// apps/frontend/src/app/en/book/page.tsx
// Phase 3d polish — English booking page mirror.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { WizardShell } from "@/components/features/booking/WizardShell";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("booking.page.title"),
    description: t("booking.page.subhead"),
    path: "/en/book",
    locale: "en",
  });
}

export default async function BookingPageEn() {
  const [services, settings] = await Promise.all([
    listServicesServer("en"),
    getSettingsServer("en"),
  ]);

  return (
    <WizardShell
      locale="en"
      services={services}
      confirmationPath="/en/book/confirmation"
      settings={settings}
    />
  );
}
