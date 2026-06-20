// apps/frontend/src/app/en/services/page.tsx
// Services magazine spread (EN). Uses batch listAllPricingServer to compute lowest-price per service in one call (kills C-3 N+1).

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listAllPricingServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { ConcessionBadge, Container } from "@/components/shared";
import { ServicesIndex, ServiceRichRow, HowItWorksBeat, ServicesEditorialClose, findLowestPrice, type ServiceWithPricing } from "@/components/features/services";
import { pickT } from "@/lib/i18n/pick";

const SERVICES_BANNER_IMAGE =
  "/others/breadcrumb.jpg";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
const stringsRes = await getUiStringsServer("en");
const t = createT(stringsRes.strings, "en");
return buildMetadata({ title: t("services.page.title"), description: t("services.page.subhead"), path: "/en/services", locale: "en" });
}

export default async function ServicesListEn() {
const [stringsRes, services, settings, allPricing] = await Promise.all([
getUiStringsServer("en"),
listServicesServer("en"),
getSettingsServer("en"),
listAllPricingServer("en"),
]);
const t = createT(stringsRes.strings, "en");
const pricingByServiceId = new Map(allPricing.map((g) => [g.service_id, g.categories]));

const data: ServiceWithPricing[] = services.map((s) => {
const categories = pricingByServiceId.get(s.id) ?? [];
const { price, routeLabel } = findLowestPrice(categories);
return { service: s, lowestPrice: price, lowestRouteLabel: routeLabel };
});

return (
<>
<section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
<div className="absolute inset-0">
<Image src={SERVICES_BANNER_IMAGE} alt="Professional transport services" fill sizes="100vw" className="object-cover" priority />
<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
</div>
<Container className="relative py-10 md:py-12">
<nav aria-label="Breadcrumb" className="mb-8">
<ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
<li><Link href="/en" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">{pickT(t, "nav.home", "Home")}</Link></li>
<li aria-hidden="true">/</li>
<li className="text-[var(--color-text-on-strong)]">{t("services.page.title")}</li>
</ol>
</nav>
<div className="max-w-3xl">
<p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">{pickT(t, "services.page.eyebrow", "Services")}</p>
<h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
{pickT(t, "services.page.heading_part1", "Four ways")}
<br />
<span className="italic text-[var(--color-accent-secondary)]">{pickT(t, "services.page.heading_part2", "to get there.")}</span>
</h1>
<p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">{t("services.page.subhead")}</p>
<p className="mt-4 text-[11.5px] uppercase tracking-[0.18em] text-[rgba(247,244,234,0.68)]">{pickT(t, "services.page.region", "Stuttgart · Esslingen · Deizisau")}</p>
</div>
</Container>
</section>
<section className="bg-[var(--color-bg-page)]">
<Container className="pt-8 pb-0 md:pt-10"><ConcessionBadge settings={settings} tone="light" /></Container>
</section>
<ServicesIndex t={t} locale="en" data={data} />
{data.slice(0, 2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
<ServiceRichRow key={service.id} t={t} locale="en" service={service} index={idx} detailHref={`/en/services/${service.slug}`} lowestPrice={lowestPrice} lowestRouteLabel={lowestRouteLabel} />
))}
<HowItWorksBeat t={t} locale="en" />
{data.slice(2).map(({ service, lowestPrice, lowestRouteLabel }, idx) => (
<ServiceRichRow key={service.id} t={t} locale="en" service={service} index={idx + 2} detailHref={`/en/services/${service.slug}`} lowestPrice={lowestPrice} lowestRouteLabel={lowestRouteLabel} />
))}
<ServicesEditorialClose t={t} locale="en" settings={settings} pricingHref="/en/pricing" />
<JsonLd
data={buildBreadcrumbJsonLd([
{ name: pickT(t, "nav.home", "Home"), href: "/en" },
{ name: t("services.page.title"), href: "/en/services" },
])}
/>
</>
);
}
