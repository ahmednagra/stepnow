// apps/frontend/src/app/en/page.tsx
// English homepage: hero + above-fold awaited, slow sections streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listTestimonialsServer } from "@/services/testimonials";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { MobileStickyBar, ScrollReveal } from "@/components/shared";
import {
  HeroHomeSection, HomeServicesSection, TestimonialsSection, TrustStrip,
} from "@/components/features/home";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [stringsRes, settings] = await Promise.all([getUiStringsServer("en"), getSettingsServer("en")]);
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: settings.default_meta_title || t("home.hero.headline"),
    description: t("home.hero.subhead"),
    path: "/en", locale: "en",
    ogImage: settings.default_og_image_url ?? undefined,
  });
}

const SectionFallback = () => <div className="min-h-[420px] bg-cream" aria-hidden="true" />;

async function DeferredTestimonials({ locale }: { locale: "en" }) {
  const testimonials = await listTestimonialsServer(locale);
  return <ScrollReveal><TestimonialsSection testimonials={testimonials} /></ScrollReveal>;
}

export default async function HomePageEn() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("en"),
    listServicesServer("en"),
    getSettingsServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  return (
    <>
      <HeroHomeSection t={t} settings={settings} locale="en" />

      <TrustStrip settings={settings} />

      <HomeServicesSection t={t} locale="en" services={services} />

      <Suspense fallback={<SectionFallback />}><DeferredTestimonials locale="en" /></Suspense>

      <MobileStickyBar settings={settings} />
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
