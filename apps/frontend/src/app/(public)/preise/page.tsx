// apps/frontend/src/app/(public)/preise/page.tsx
// Pricing page (DE). Revalidate 10min; admin-bff invalidates pricing tag on category/item mutation.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container, MobileStickyBar } from "@/components/shared";
import { PricingTabs, PricingFeaturedHero, PricingTrustStrip, PricingIncludedMoment, PricingExcludedStrip, PricingComparison, PricingPaymentCancellation, type ServicePricing } from "@/components/features/pricing";
import type { PricingCategoryPublic, PricingItemPublic } from "@/types";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
const stringsRes = await getUiStringsServer("de");
const t = createT(stringsRes.strings, "de");
return buildMetadata({ title: t("pricing.page.title"), description: t("pricing.page.intro"), path: "/preise", locale: "de" });
}

function findFeaturedItem(data: ServicePricing[]): { item: PricingItemPublic | null; serviceImageUrl: string | null | undefined } {
const airportSlugs = ["flughafentransfer", "airport-transfer"];
const airport = data.find((d) => airportSlugs.includes(d.service.slug));
const target = airport ?? data[0];
if (!target) return { item: null, serviceImageUrl: null };
const firstCategory = target.categories.find((c) => c.items.length > 0);
const firstItem = firstCategory?.items[0] ?? null;
return { item: firstItem, serviceImageUrl: target.service.hero_image_url };
}

export default async function PricingPageDe() {
const [stringsRes, services, settings] = await Promise.all([getUiStringsServer("de"), listServicesServer("de"), getSettingsServer("de")]);
const t = createT(stringsRes.strings, "de");
const pricingByService: ServicePricing[] = await Promise.all(
services.map(async (s) => {
try {
const categories = await getPricingForServiceServer(s.slug, "de");
return { service: s, categories };
} catch {
return { service: s, categories: [] as PricingCategoryPublic[] };
}
}),
);
const { item: featuredItem, serviceImageUrl: featuredBackground } = findFeaturedItem(pricingByService);

return (
<>
<section className="bg-cream">
<Container className="pt-3 pb-5 md:pt-5 md:pb-6">
<div className="flex flex-wrap items-end justify-between gap-6">
<div className="max-w-2xl">
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{pickT(t, "pricing.page.eyebrow", "Preise")}</p>
<h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight md:text-[40px]">{t("pricing.page.title")}</h1>
<p className="mt-2 text-[12.5px] text-mute-soft">{t("pricing.disclaimer")}</p>
</div>
<p className="max-w-md text-right text-[14px] text-mute md:text-right">{t("pricing.page.intro")}</p>
</div>
<div className="mt-5"><ConcessionBadge settings={settings} tone="light" /></div>
</Container>
</section>
<PricingFeaturedHero t={t} locale="de" settings={settings} featuredItem={featuredItem} backgroundImageUrl={featuredBackground} bookingHref="/buchen" />
<section className="bg-cream">
<Container className="py-12 md:py-14">
<div className="mb-7 flex flex-wrap items-end justify-between gap-6">
<div>
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{pickT(t, "pricing.tabs.eyebrow", "Vollständige Preisliste")}</p>
<h2 className="mt-1 font-serif text-[28px] leading-tight tracking-tight md:text-[32px]">{pickT(t, "pricing.tabs.heading", "Jede Strecke, jeder Service")}</h2>
</div>
<p className="max-w-sm text-right text-[13.5px] text-mute">{pickT(t, "pricing.tabs.lead", "Wählen Sie einen Service, um alle Festpreis-Strecken anzusehen. Andere Strecken erhalten ein Angebot innerhalb von 30 Minuten.")}</p>
</div>
<PricingTabs strings={stringsRes.strings} locale="de" data={pricingByService} />
</Container>
</section>
<PricingTrustStrip t={t} locale="de" />
<PricingIncludedMoment t={t} locale="de" />
<PricingExcludedStrip t={t} locale="de" />
<PricingComparison t={t} locale="de" />
<PricingPaymentCancellation t={t} locale="de" agbHref="/agb" />
<section className="border-t border-line bg-cream">
<Container className="flex justify-center py-6 md:py-7"><ConcessionBadge settings={settings} tone="light" /></Container>
</section>
<MobileStickyBar settings={settings} />
</>
);
}
