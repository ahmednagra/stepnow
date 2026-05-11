// src/app/(public)/page.tsx
// German homepage — Phase 3c polish: split hero with right-side feature block,
// restrained scroll-reveal motion, refined spacing and typography.

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
import { Container, ScrollReveal } from "@/components/shared";
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
      {/* === 1. Hero — split layout with right-side typographic feature block === */}
      <section className="relative overflow-hidden bg-ink text-cream">
        {/* Subtle vignette in the corners for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]"
        />

        <Container className="relative grid gap-16 py-section-mobile md:grid-cols-12 md:gap-12 md:py-section lg:py-section-lg">
          {/* Left: headline cluster */}
          <div className="flex flex-col justify-center gap-8 md:col-span-7">
            <p className="label-eyebrow !text-gold animate-fade-in">
              {t("home.hero.pre_heading")}
            </p>
            <h1 className="font-serif text-display-md md:text-display-lg lg:text-display-xl">
              {t("home.hero.headline")}
            </h1>
            <p className="max-w-xl text-body-lg text-cream/70">{t("home.hero.subhead")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
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
                  leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                  className="border-cream/40 text-cream hover:bg-cream/5"
                >
                  {settings.phone}
                </Button>
              </a>
            </div>
          </div>

          {/* Right: typographic feature block */}
          <div className="md:col-span-5 md:flex md:items-center">
            <HeroBookingWidget locale="de" />
          </div>
        </Container>
      </section>

      {/* === 2. Trust strip === */}
      <TrustStrip t={t} />

      {/* === 3. Services grid === */}
      <ScrollReveal as="section">
        <Container className="py-section">
          <header className="mb-16 max-w-3xl">
            <p className="label-eyebrow">{t("home.services.pre_heading")}</p>
            <h2 className="mt-3 font-serif text-section md:text-display-md">
              {t("home.services.heading")}
            </h2>
            <p className="mt-5 max-w-prose text-body-lg text-mute">
              {t("home.services.subheading")}
            </p>
          </header>
          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/dienstleistungen/${s.slug}`}
                className="group relative flex flex-col gap-4 bg-cream p-8 transition-colors duration-base ease-out-premium hover:bg-paper md:p-10"
              >
                <h3 className="font-serif text-2xl tracking-tight md:text-3xl">{s.title}</h3>
                <p className="max-w-md text-mute">{s.short_description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-medium uppercase tracking-[0.14em] text-gold-dark transition-colors duration-base group-hover:text-ink">
                  {t("services.card.learn_more")}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </ScrollReveal>

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

      {/* === 7. Testimonials === */}
      <ScrollReveal>
        <TestimonialsSection t={t} testimonials={testimonials} />
      </ScrollReveal>

      {/* === 8. FAQ teaser === */}
      <ScrollReveal>
        <FaqTeaser t={t} faqs={faqs} locale="de" />
      </ScrollReveal>

      {/* === 9. Final CTA === */}
      <section className="bg-ink text-cream">
        <Container className="py-section text-center md:py-section-lg">
          <ScrollReveal>
            <p className="label-eyebrow !text-gold">{t("home.final_cta.pre_heading")}</p>
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
                  leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                  className="border-cream/40 text-cream hover:bg-cream/5"
                >
                  {settings.phone}
                </Button>
              </a>
            </div>
            {settings.concession_number && (
              <p className="mt-16 text-[11px] uppercase tracking-[0.22em] text-cream/35">
                {t("home.trust.licensed")} · {settings.concession_number}
              </p>
            )}
          </ScrollReveal>
        </Container>
      </section>

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
