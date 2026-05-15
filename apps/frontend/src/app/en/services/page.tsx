// apps/frontend/src/app/en/services/page.tsx
// Tier 4 services magazine spread (EN).

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container } from "@/components/shared";
import {
  ServicesIndex,
  ServiceRichRow,
  HowItWorksBeat,
  ServicesEditorialClose,
  findLowestPrice,
  type ServiceWithPricing,
} from "@/components/features/services";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("services.page.title"),
    description: t("services.page.subhead"),
    path: "/en/services",
    locale: "en",
  });
}

export default async function ServicesListEn() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("en"),
    listServicesServer("en"),
    getSettingsServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  const data: ServiceWithPricing[] = await Promise.all(
    services.map(async (s) => {
      try {
        const categories = await getPricingForServiceServer(s.slug, "en");
        const { price, routeLabel } = findLowestPrice(categories);
        return { service: s, lowestPrice: price, lowestRouteLabel: routeLabel };
      } catch {
        return { service: s, lowestPrice: null, lowestRouteLabel: null };
      }
    }),
  );

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-8 pb-7 md:pt-10 md:pb-9">
          <div className="grid items-end gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {pickT(t, "services.page.eyebrow", "Services")}
              </p>
              <h1 className="mt-2 font-serif text-[44px] leading-[0.98] tracking-tight md:text-[64px]">
                {pickT(t, "services.page.heading_part1", "Four ways")}
                <br />
                <span className="italic text-gold-deep">
                  {pickT(t, "services.page.heading_part2", "to get there.")}
                </span>
              </h1>
              <div className="mt-5">
                <ConcessionBadge settings={settings} tone="light" />
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-[15.5px] leading-relaxed text-mute md:ml-auto md:max-w-sm">
                {t("services.page.subhead")}
              </p>
              <p className="mt-3 text-[11.5px] uppercase tracking-[0.18em] text-mute-soft">
                {pickT(t, "services.page.region", "Stuttgart · Esslingen · Deizisau")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <ServicesIndex t={t} locale="en" data={data} />

      {data.slice(0, 2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
        <ServiceRichRow
          key={service.id}
          t={t}
          locale="en"
          service={service}
          index={idx}
          detailHref={`/en/services/${service.slug}`}
          lowestPrice={lowestPrice}
          lowestRouteLabel={lowestRouteLabel}
        />
      ))}

      <HowItWorksBeat t={t} locale="en" />

      {data.slice(2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
        <ServiceRichRow
          key={service.id}
          t={t}
          locale="en"
          service={service}
          index={idx + 2}
          detailHref={`/en/services/${service.slug}`}
          lowestPrice={lowestPrice}
          lowestRouteLabel={lowestRouteLabel}
        />
      ))}

      <ServicesEditorialClose t={t} locale="en" settings={settings} pricingHref="/en/pricing" />
    </>
  );
}
