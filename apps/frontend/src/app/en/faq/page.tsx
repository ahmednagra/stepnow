// apps/frontend/src/app/en/faq/page.tsx
// FAQ page (EN) — every published FAQ, grouped by category. ISR; admin FAQ edits bust the "faqs" tag.

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
  const t = createT((await getUiStringsServer("en")).strings, "en");
  return buildMetadata({ title: t("faq.page.title"), description: t("faq.meta_description"), path: "/en/faq", locale: "en" });
}

export default async function FaqPageEn() {
  const [stringsRes, settings, faqs, services] = await Promise.all([
    getUiStringsServer("en"),
    getSettingsServer("en"),
    listFaqsServer("en"),
    listServicesServer("en"),
  ]);
  return (
    <FaqPageContent
      t={createT(stringsRes.strings, "en")}
      locale="en"
      faqs={faqs}
      services={services}
      settings={settings}
    />
  );
}
