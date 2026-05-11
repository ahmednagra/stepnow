// apps/frontend/src/app/(public)/page.tsx
// Phase 3d polish — German homepage.
// Closes audit items H-1 (concession badge above the fold), H-2 (mobile
// sticky bar), H-3 (refined hero subhead), H-5 (services card hover),
// M-7 (stagger reveals on services & testimonials).

import type { Metadata } from "next";
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
import {
  ConcessionBadge,
  Container,
  MobileStickyBar,
  ScrollReveal,
} from "@/components/shared";
import { Button } from "@/components/ui";
import {
  FaqTeaser,
  FleetPreview,
  HeroBookingWidget,
  HowItWorks,
  TestimonialsSection,
  TrustStrip,
  WhyStepNow,
} from "@/components/features/home";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [stringsRes, settings] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: settings.default_meta_title || t("home.hero.headline"),
    description: t("home.hero.subhead"),
    path: "/",
    locale: "de",
    ogImage: settings.default_og_image_url ?? undefined,
  });
}

export default async function HomePageDe() {
  const [stringsRes, services, vehicles, testimonials, faqs, settings] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
    listVehiclesServer("de"),
    listTestimonialsServer("de"),
    listFaqsServer("de"),
    getSettingsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  return (
    <>
      {/* === 1. Hero — split layout, polished === */}
      <section className="relative overflow-hidden bg-ink text-cream">
        {/* Atmospheric vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,transparent_30%,rgba(0,0,0,0.55)_100%)]"
        />
        {/* Subtle gold hairline accent at top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />

        <Container className="relative grid gap-16 py-section-mobile md:grid-cols-12 md:gap-12 md:py-section lg:py-section-lg">
          {/* Left: headline cluster */}
          <div className="flex flex-col justify-center gap-7 md:col-span-7">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold animate-fade-in">
                {t("home.hero.pre_heading")}
              </p>
            </div>
            <h1 className="font-serif text-display-md md:text-display-lg lg:text-display-xl">
              {t("home.hero.headline")}
            </h1>
            {/* Serif italic subhead — premium editorial feel (audit H-3) */}
            <p className="max-w-xl font-serif text-2xl italic leading-snug text-cream/80 md:text-3xl">
              {t("home.hero.subhead")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Link href="/buchen">
                <Button
                  size="lg"
                  variant="inverse"
                  trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {t("home.hero.cta_book")}
                </Button>
              </Link>
              <a href={toTelHref(settings.phone)}>
                <Button
                  size="lg"
                  variant="outline"
                  leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />}
                  className="border-cream/40 text-cream hover:bg-cream/5"
                >
                  <span className="tabular-nums">{settings.phone}</span>
                </Button>
              </a>
            </div>
            {/* Concession badge — strongest single trust signal (audit H-1) */}
            <ConcessionBadge settings={settings} tone="dark" className="mt-2" />
          </div>

          {/* Right: booking widget */}
          <div className="md:col-span-5 md:flex md:items-center">
            <HeroBookingWidget locale="de" />
          </div>
        </Container>
      </section>

      {/* === 2. Trust strip === */}
      <TrustStrip t={t} />

      {/* === 3. Services grid — staggered reveal === */}
      <section className="bg-cream">
        <Container className="py-section">
          <ScrollReveal as="header" className="mb-16 max-w-3xl">
            <p className="label-eyebrow">{t("home.services.pre_heading")}</p>
            <h2 className="mt-3 font-serif text-section md:text-display-md">
              {t("home.services.heading")}
            </h2>
            <p className="mt-5 max-w-prose text-body-lg text-mute">
              {t("home.services.subheading")}
            </p>
          </ScrollReveal>
          <ScrollReveal
            as="ul"
            stagger
            className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2"
          >
            {services.map((s) => (
              <li key={s.id} className="bg-cream">
                <Link
                  href={`/dienstleistungen/${s.slug}`}
                  className="group relative flex h-full flex-col gap-4 p-8 transition-all duration-base ease-out-premium hover:shadow-ring-ink md:p-10"
                >
                  <h3 className="font-serif text-2xl tracking-tight md:text-3xl">{s.title}</h3>
                  <p className="max-w-md text-mute">{s.short_description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base group-hover:text-ink">
                    {t("services.card.learn_more")}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ScrollReveal>
        </Container>
      </section>

      {/* === 4. How it works === */}
      <ScrollReveal>
        <HowItWorks t={t} />
      </ScrollReveal>

      {/* === 5. Why StepNow === */}
      <ScrollReveal>
        <WhyStepNow t={t} />
      </ScrollReveal>

      {/* === 6. Fleet preview === */}
      <ScrollReveal>
        <FleetPreview t={t} vehicles={vehicles} />
      </ScrollReveal>

      {/* === 7. Testimonials — rotating editorial quote === */}
      <ScrollReveal>
        <TestimonialsSection t={t} testimonials={testimonials} />
      </ScrollReveal>

      {/* === 8. FAQ teaser === */}
      <ScrollReveal>
        <FaqTeaser t={t} faqs={faqs} locale="de" />
      </ScrollReveal>

      {/* === 9. Final CTA === */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />
        <Container className="py-section text-center md:py-section-lg">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {t("home.final_cta.pre_heading")}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-serif text-section md:text-display-md">
              {t("home.final_cta.heading")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-body-lg text-cream/65">
              {t("home.final_cta.subhead")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/buchen">
                <Button
                  size="lg"
                  variant="inverse"
                  trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {t("home.hero.cta_book")}
                </Button>
              </Link>
              <a href={toTelHref(settings.phone)}>
                <Button
                  size="lg"
                  variant="outline"
                  leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />}
                  className="border-cream/40 text-cream hover:bg-cream/5"
                >
                  <span className="tabular-nums">{settings.phone}</span>
                </Button>
              </a>
            </div>
            <div className="mt-14 flex flex-col items-center gap-3">
              <ConcessionBadge settings={settings} tone="dark" />
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Mobile sticky bar — call/book one-tap (audit H-2) */}
      <MobileStickyBar settings={settings} />

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
