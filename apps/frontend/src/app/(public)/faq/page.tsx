// apps/frontend/src/app/(public)/faq/page.tsx
// FAQ page (DE) — every published FAQ, grouped by category. ISR; admin FAQ edits bust the "faqs" tag.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { listServicesServer } from "@/services/services";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { FaqPageContent } from "@/components/features/faq";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = createT((await getUiStringsServer("de")).strings, "de");
  return buildMetadata({ title: t("faq.page.title"), description: t("faq.meta_description"), path: "/faq", locale: "de" });
}

export default async function FaqPageDe() {
  const [stringsRes, settings, faqs, services] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
    listFaqsServer("de"),
    listServicesServer("de"),
  ]);
  return (
    <FaqPageContent
      t={createT(stringsRes.strings, "de")}
      locale="de"
      faqs={faqs}
      services={services}
      settings={settings}
    />
  );
}
