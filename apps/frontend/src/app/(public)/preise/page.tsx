import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container, MobileStickyBar } from "@/components/shared";
import { PricingTable } from "@/components/features/pricing/PricingTable";
import type { PricingCategoryPublic } from "@/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("pricing.page.title"),
    description: t("pricing.page.intro"),
    path: "/preise",
    locale: "de",
  });
}

export default async function PricingPageDe() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
    getSettingsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  const pricingByService = await Promise.all(
    services.map(async (s) => {
      try {
        const pricing = await getPricingForServiceServer(s.slug, "de");
        return { service: s, pricing };
      } catch {
        return { service: s, pricing: [] as PricingCategoryPublic[] };
      }
    }),
  );

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-10 pb-6 md:pt-14 md:pb-8">
          <header className="max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">{t("pricing.page.title")}</h1>
            <p className="mt-3 text-body-lg text-mute">{t("pricing.page.intro")}</p>
            <p className="mt-2 text-[13.5px] text-mute">{t("pricing.disclaimer")}</p>
            <div className="mt-6">
              <ConcessionBadge settings={settings} tone="light" />
            </div>
          </header>
        </Container>
      </section>
      {pricingByService.map((entry, idx) => (
        <PricingTable
          key={entry.service.id}
          t={t}
          service={entry.service}
          categories={entry.pricing}
          locale="de"
          showDivider={idx > 0}
        />
      ))}
      <MobileStickyBar settings={settings} />
    </>
  );
}
