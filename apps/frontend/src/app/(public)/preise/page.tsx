import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listAllPricingServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container, MobileStickyBar } from "@/components/shared";
import {
  PricingTabs,
  PricingTrustStrip,
  PricingIncludedMoment,
  PricingExcludedStrip,
  PricingComparison,
  PricingPaymentCancellation,
  type ServicePricing,
} from "@/components/features/pricing";
import type { PricingCategoryPublic } from "@/types";
import { pickT } from "@/lib/i18n/pick";

const PRICING_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1686199948265-ddc4ebb1cc92?auto=format&fit=crop&w=2000&q=80";

export const revalidate = 600;

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
  const [stringsRes, services, settings, allPricing] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
    getSettingsServer("de"),
    listAllPricingServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");
  const pricingByServiceId = new Map(allPricing.map((g) => [g.service_id, g.categories]));
  const pricingByService: ServicePricing[] = services.map((s) => ({
    service: s,
    categories: pricingByServiceId.get(s.id) ?? ([] as PricingCategoryPublic[]),
  }));
  return (
    <>
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image
            src={PRICING_BANNER_IMAGE}
            alt="Professional transport pricing"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
        </div>
        <Container className="relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
              <li>
                <Link href="/" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">
                  {pickT(t, "nav.home", "Startseite")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{t("pricing.page.title")}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pickT(t, "pricing.page.eyebrow", "Preise")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {t("pricing.page.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {t("pricing.page.intro")}
            </p>
            <p className="mt-4 text-[11.5px] leading-relaxed text-[rgba(247,244,234,0.68)]">
              {t("pricing.disclaimer")}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <Container className="pt-8 pb-section md:pt-10">
          <ConcessionBadge settings={settings} tone="light" />
          <div className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "pricing.tabs.eyebrow", "Vollstaendige Preisliste")}
              </p>
              <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
                {pickT(t, "pricing.tabs.heading", "Jede Strecke, jeder Service")}
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
              {pickT(
                t,
                "pricing.tabs.lead",
                "Waehlen Sie einen Service, um alle Festpreis-Strecken anzusehen. Andere Strecken erhalten ein Angebot innerhalb von 30 Minuten.",
              )}
            </p>
          </div>
          <PricingTabs strings={stringsRes.strings} locale="de" data={pricingByService} />
        </Container>
      </section>

      <PricingTrustStrip t={t} locale="de" />
      <PricingIncludedMoment t={t} locale="de" />
      <PricingExcludedStrip t={t} locale="de" />
      <PricingComparison t={t} locale="de" />
      <PricingPaymentCancellation t={t} locale="de" agbHref="/agb" />

      <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
        <Container className="flex justify-center py-8 md:py-10">
          <ConcessionBadge settings={settings} tone="light" />
        </Container>
      </section>
      <MobileStickyBar settings={settings} />
    </>
  );
}
