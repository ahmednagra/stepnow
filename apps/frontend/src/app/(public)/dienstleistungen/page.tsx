// apps/frontend/src/app/(public)/dienstleistungen/page.tsx
// Services magazine spread (DE). Uses batch listAllPricingServer to compute lowest-price per service in one call (kills C-3 N+1).

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listAllPricingServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container } from "@/components/shared";
import { ServicesIndex, ServiceRichRow, HowItWorksBeat, ServicesEditorialClose, findLowestPrice, type ServiceWithPricing } from "@/components/features/services";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
const stringsRes = await getUiStringsServer("de");
const t = createT(stringsRes.strings, "de");
return buildMetadata({ title: t("services.page.title"), description: t("services.page.subhead"), path: "/dienstleistungen", locale: "de" });
}

export default async function ServicesListDe() {
const [stringsRes, services, settings, allPricing] = await Promise.all([
getUiStringsServer("de"),
listServicesServer("de"),
getSettingsServer("de"),
listAllPricingServer("de"),
]);
const t = createT(stringsRes.strings, "de");
const pricingByServiceId = new Map(allPricing.map((g) => [g.service_id, g.categories]));

const data: ServiceWithPricing[] = services.map((s) => {
const categories = pricingByServiceId.get(s.id) ?? [];
const { price, routeLabel } = findLowestPrice(categories);
return { service: s, lowestPrice: price, lowestRouteLabel: routeLabel };
});

return (
<>
<section className="bg-cream">
<Container className="pt-8 pb-7 md:pt-10 md:pb-9">
<div className="grid items-end gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
<div>
<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">{pickT(t, "services.page.eyebrow", "Leistungen")}</p>
<h1 className="mt-2 font-serif text-[44px] leading-[0.98] tracking-tight md:text-[64px]">
{pickT(t, "services.page.heading_part1", "Vier Wege,")}
<br />
<span className="italic text-gold-deep">{pickT(t, "services.page.heading_part2", "anzukommen.")}</span>
</h1>
<div className="mt-5"><ConcessionBadge settings={settings} tone="light" /></div>
</div>
<div className="md:text-right">
<p className="text-[15.5px] leading-relaxed text-mute md:ml-auto md:max-w-sm">{t("services.page.subhead")}</p>
<p className="mt-3 text-[11.5px] uppercase tracking-[0.18em] text-mute-soft">{pickT(t, "services.page.region", "Stuttgart · Esslingen · Deizisau")}</p>
</div>
</div>
</Container>
</section>
<ServicesIndex t={t} locale="de" data={data} />
{data.slice(0, 2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
<ServiceRichRow key={service.id} t={t} locale="de" service={service} index={idx} detailHref={`/dienstleistungen/${service.slug}`} lowestPrice={lowestPrice} lowestRouteLabel={lowestRouteLabel} />
))}
<HowItWorksBeat t={t} locale="de" />
{data.slice(2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
<ServiceRichRow key={service.id} t={t} locale="de" service={service} index={idx + 2} detailHref={`/dienstleistungen/${service.slug}`} lowestPrice={lowestPrice} lowestRouteLabel={lowestRouteLabel} />
))}
<ServicesEditorialClose t={t} locale="de" settings={settings} pricingHref="/preise" />
</>
);
}
