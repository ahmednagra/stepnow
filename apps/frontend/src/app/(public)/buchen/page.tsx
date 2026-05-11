// apps/frontend/src/app/(public)/buchen/page.tsx
// Phase 3d polish — German booking page hosts the WizardShell. The shell
// receives settings so the help line at the bottom can show the phone.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { WizardShell } from "@/components/features/booking/WizardShell";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("booking.page.title"),
    description: t("booking.page.subhead"),
    path: "/buchen",
    locale: "de",
  });
}

export default async function BookingPageDe() {
  const [services, settings] = await Promise.all([
    listServicesServer("de"),
    getSettingsServer("de"),
  ]);

  return (
    <WizardShell
      locale="de"
      services={services}
      confirmationPath="/buchen/bestaetigung"
      settings={settings}
    />
  );
}
