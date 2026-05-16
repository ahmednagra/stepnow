// apps/frontend/src/app/en/pricing/page.tsx
// Pricing page (EN). Uses batch listAllPricingServer to fetch all services' pricing in one call (kills C-3 N+1).

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listAllPricingServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container, MobileStickyBar } from "@/components/shared";
import { PricingTabs, PricingFeaturedHero, PricingTrustStrip, PricingIncludedMoment, PricingExcludedStrip, PricingComparison, PricingPaymentCancellation, type ServicePricing } from "@/components/features/pricing";
import type { PricingCategoryPublic, PricingItemPublic } from "@/types";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
const stringsRes = await getUiStringsServer("en");
const t = createT(stringsRes.strings, "en");
return buildMetadata({ title: t("pricing.page.title"), description: t("pricing.page.intro"), path: "/en/pricing", locale: "en" });
}

function findFeaturedItem(data: ServicePricing[]): { item: PricingItemPublic | null; serviceImageUrl: string | null | undefined } {
const airportSlugs = ["airport-transfer", "flughafentransfer"];
const airport = data.find((d) => airportSlugs.includes(d.service.slug));
const target = airport ?? data[0];
if (!target) return { item: null, serviceImageUrl: null };
const firstCategory = target.categories.find((c) => c.items.length > 0);
const firstItem = firstCategory?.items[0] ?? null;
return { item: firstItem, serviceImageUrl: target.service.hero_image_url };
}

export default async function PricingPageEn() {
const [stringsRes, services, settings, allPricing] = await Promise.all([
getUiStringsServer("en"),
listServicesServer("en"),
getSettingsServer("en"),
listAllPricingServer("en"),
]);
const t = createT(stringsRes.strings, "en");
const pricingByServiceId = new Map(allPricing.map((g) => [g.service_id, g.categories]));
const pricingByService: ServicePricing[] = services.map((s) => ({
service: s,
categories: pricingByServiceId.get(s.id) ?? ([] as PricingCategoryPublic[]),
}));
const { item: featuredItem, serviceImageUrl: featuredBackground } = findFeaturedItem(pricingByService);

return (
<>
<section className="bg-cream">
<Container className="pt-3 pb-5 md:pt-5 md:pb-6">
<div className="flex flex-wrap items-end justify-between gap-6">
<div className="max-w-2xl">
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{pickT(t, "pricing.page.eyebrow", "Pricing")}</p>
<h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight md:text-[40px]">{t("pricing.page.title")}</h1>
<p className="mt-2 text-[12.5px] text-mute-soft">{t("pricing.disclaimer")}</p>
</div>
<p className="max-w-md text-right text-[14px] text-mute md:text-right">{t("pricing.page.intro")}</p>
</div>
<div className="mt-5"><ConcessionBadge settings={settings} tone="light" /></div>
</Container>
</section>
<PricingFeaturedHero t={t} locale="en" settings={settings} featuredItem={featuredItem} backgroundImageUrl={featuredBackground} bookingHref="/en/book" />
<section className="bg-cream">
<Container className="py-12 md:py-14">
<div className="mb-7 flex flex-wrap items-end justify-between gap-6">
<div>
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{pickT(t, "pricing.tabs.eyebrow", "Full price list")}</p>
<h2 className="mt-1 font-serif text-[28px] leading-tight tracking-tight md:text-[32px]">{pickT(t, "pricing.tabs.heading", "Every route, every service")}</h2>
</div>
<p className="max-w-sm text-right text-[13.5px] text-mute">{pickT(t, "pricing.tabs.lead", "Select a service to browse all available fixed-price routes. Custom destinations get a quote within 30 minutes.")}</p>
</div>
<PricingTabs strings={stringsRes.strings} locale="en" data={pricingByService} />
</Container>
</section>
<PricingTrustStrip t={t} locale="en" />
<PricingIncludedMoment t={t} locale="en" />
<PricingExcludedStrip t={t} locale="en" />
<PricingComparison t={t} locale="en" />
<PricingPaymentCancellation t={t} locale="en" agbHref="/en/terms" />
<section className="border-t border-line bg-cream">
<Container className="flex justify-center py-6 md:py-7"><ConcessionBadge settings={settings} tone="light" /></Container>
</section>
<MobileStickyBar settings={settings} />
</>
);
}
