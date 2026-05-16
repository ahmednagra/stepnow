// apps/frontend/src/app/(public)/page.tsx
// German homepage: hero + above-fold awaited, slow sections streamed via Suspense.

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Phone } from "lucide-react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { listVehiclesServer } from "@/services/vehicles";
import { listTestimonialsServer } from "@/services/testimonials";
import { listFaqsServer } from "@/services/faqs";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { toTelHref } from "@/utils/formatters";
import { ConcessionBadge, Container, MobileStickyBar, ScrollReveal } from "@/components/shared";
import { Button } from "@/components/ui";
import {
  FaqTeaser, FleetPreview, HeroBookingWidget, HowItWorks, TestimonialsSection, TrustStrip, WhyStepNow,
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
      <section className="relative overflow-hidden bg-ink text-cream">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <Container className="relative grid gap-10 pt-section-hero pb-section-hero md:grid-cols-12 md:gap-12 md:pt-section-hero-md md:pb-section-hero-md lg:pt-section-hero-lg lg:pb-section-hero-lg">
          <div className="flex flex-col justify-center gap-5 md:col-span-8">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold animate-fade-in">
                {t("home.hero.pre_heading")}
              </p>
            </div>
            <h1 className="font-serif text-display-md md:text-display-lg lg:text-display-xl">
              {t("home.hero.headline")}
            </h1>
            <p className="max-w-xl font-serif text-2xl italic leading-snug text-cream/80 md:text-3xl">
              {t("home.hero.subhead")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <Link href="/buchen">
                <Button size="lg" variant="inverse" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                  {t("home.hero.cta_book")}
                </Button>
              </Link>
              <a href={toTelHref(settings.phone)}>
                <Button size="lg" variant="outline" leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />} className="border-cream/40 text-cream hover:bg-cream/5">
                  <span className="tabular-nums">{settings.phone}</span>
                </Button>
              </a>
            </div>
            <ConcessionBadge settings={settings} tone="dark" className="mt-1" />
          </div>
          <div className="md:col-span-4 md:mt-6 md:flex md:items-start">
            <HeroBookingWidget locale="de" />
          </div>
        </Container>
      </section>

      <TrustStrip t={t} />

      <section className="bg-cream">
        <Container className="py-section">
          <ScrollReveal as="header" className="mb-8 max-w-3xl">
            <p className="label-eyebrow">{t("home.services.pre_heading")}</p>
            <h2 className="mt-2 font-serif text-section md:text-display-md">{t("home.services.heading")}</h2>
            <p className="mt-3 max-w-md text-body-lg text-mute">{t("home.services.subheading")}</p>
          </ScrollReveal>
          <ScrollReveal as="ul" stagger className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="bg-cream">
                <Link href={`/dienstleistungen/${s.slug}`} className="group relative flex h-full flex-col gap-4 p-8 transition-all duration-base ease-out-premium hover:shadow-ring-ink md:p-10">
                  <h3 className="text-[22px] font-semibold tracking-tight text-ink md:text-[24px]">{s.title}</h3>
                  <p className="max-w-md text-mute">{s.short_description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base group-hover:text-ink">
                    {t("services.card.learn_more")}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ScrollReveal>
        </Container>
      </section>

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
