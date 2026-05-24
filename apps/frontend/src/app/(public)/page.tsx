// apps/frontend/src/app/(public)/page.tsx
// German homepage: hero + above-fold awaited, slow sections streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listVehiclesServer } from "@/services/vehicles";
import { listTestimonialsServer } from "@/services/testimonials";
import { listFaqsServer } from "@/services/faqs";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { MobileStickyBar, ScrollReveal } from "@/components/shared";
import {
  FaqTeaser, FleetPreview, HeroHomeSection, HomeServicesSection, HowItWorks, TestimonialsSection, TrustStrip, WhyStepNow,
} from "@/components/features/home";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [stringsRes, settings] = await Promise.all([getUiStringsServer("de"), getSettingsServer("de")]);
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: settings.default_meta_title || t("home.hero.headline"),
    description: t("home.hero.subhead"),
    path: "/", locale: "de",
    ogImage: settings.default_og_image_url ?? undefined,
  });
}

const SectionFallback = () => <div className="min-h-[420px] bg-cream" aria-hidden="true" />;

async function DeferredFleet({ locale }: { locale: "de" }) {
  const [stringsRes, vehicles] = await Promise.all([getUiStringsServer(locale), listVehiclesServer(locale)]);
  const t = createT(stringsRes.strings, locale);
  return <ScrollReveal><FleetPreview t={t} vehicles={vehicles} /></ScrollReveal>;
}

async function DeferredTestimonials({ locale }: { locale: "de" }) {
  const testimonials = await listTestimonialsServer(locale);
  return <ScrollReveal><TestimonialsSection testimonials={testimonials} /></ScrollReveal>;
}

async function DeferredFaq({ locale }: { locale: "de" }) {
  const [stringsRes, faqs] = await Promise.all([getUiStringsServer(locale), listFaqsServer(locale)]);
  const t = createT(stringsRes.strings, locale);
  return <ScrollReveal><FaqTeaser t={t} faqs={faqs} locale={locale} /></ScrollReveal>;
}

export default async function HomePageDe() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
    getSettingsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  return (
    <>
      <HeroHomeSection t={t} settings={settings} locale="de" />

      <TrustStrip t={t} />

      <HomeServicesSection t={t} locale="de" services={services} />

      <ScrollReveal><HowItWorks t={t} /></ScrollReveal>
      <ScrollReveal><WhyStepNow t={t} /></ScrollReveal>

      <Suspense fallback={<SectionFallback />}><DeferredFleet locale="de" /></Suspense>
      <Suspense fallback={<SectionFallback />}><DeferredTestimonials locale="de" /></Suspense>
      <Suspense fallback={<SectionFallback />}><DeferredFaq locale="de" /></Suspense>

      <MobileStickyBar settings={settings} />
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
