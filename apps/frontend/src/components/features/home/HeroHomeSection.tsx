import Image from "next/image";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale } from "@/types";
import { Container } from "@/components/shared";
import { HeroBookingWidget } from "./HeroBookingWidget";

interface HeroHomeSectionProps {
  t: TFunction;
  locale: Locale;
}

const HERO_IMAGE =
  "/vehicle/mercedes-benz-v-class.jpg";

export function HeroHomeSection({ t, locale }: HeroHomeSectionProps) {
  return (
    <section className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <div className="relative isolate overflow-hidden bg-[var(--color-text-primary)] text-[var(--color-text-on-strong)]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt={
              locale === "de"
                ? "Chauffeur-Service Fahrzeug in Fahrt"
                : "Chauffeur service vehicle in motion"
            }
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_32%]"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,17,21,0.74)_0%,rgba(15,17,21,0.62)_38%,rgba(15,17,21,0.30)_66%,rgba(15,17,21,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.08)_0%,rgba(15,17,21,0.06)_40%,rgba(15,17,21,0.48)_100%)]" />

        <Container className="relative flex min-h-[50svh] items-center py-8 md:py-10 lg:min-h-[50vh] lg:py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_24rem] lg:items-end xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-secondary)]">
                {t("home.hero.pre_heading")}
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-[40px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[56px] lg:text-[76px]">
                {t("home.hero.headline")}
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[color:rgba(247,244,234,0.84)] md:text-[18px]">
                {t("home.hero.subhead")}
              </p>
            </div>

            <div className="lg:self-end lg:justify-self-end">
              <HeroBookingWidget locale={locale} />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
