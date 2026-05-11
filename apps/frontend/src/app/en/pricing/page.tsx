// apps/frontend/src/app/en/pricing/page.tsx
// Phase 3d polish — English pricing page mirroring (public)/preise/page.tsx.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb, ConcessionBadge, Container, MobileStickyBar } from "@/components/shared";
import { PricingTable } from "@/components/features/pricing/PricingTable";
import type { PricingCategoryPublic } from "@/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("pricing.page.title"),
    description: t("pricing.page.intro"),
    path: "/en/pricing",
    locale: "en",
  });
}

export default async function PricingPageEn() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("en"),
    listServicesServer("en"),
    getSettingsServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  const pricingByService = await Promise.all(
    services.map(async (s) => {
      try {
        const pricing = await getPricingForServiceServer(s.slug, "en");
        return { service: s, pricing };
      } catch {
        return { service: s, pricing: [] as PricingCategoryPublic[] };
      }
    }),
  );

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/en" },
              { name: t("pricing.page.title"), href: "/en/pricing" },
            ]}
          />
          <header className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {t("pricing.page.eyebrow") || "Transparency"}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-section md:text-hero">
              {t("pricing.page.title")}
            </h1>
            <p className="mt-4 text-body-lg text-mute">{t("pricing.page.intro")}</p>
            <p className="mt-2 text-[13.5px] text-mute">{t("pricing.disclaimer")}</p>
            <div className="mt-8">
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
          locale="en"
          showDivider={idx > 0}
        />
      ))}

      <MobileStickyBar settings={settings} />
    </>
  );
}
