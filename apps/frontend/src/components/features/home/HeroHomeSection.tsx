import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { ConcessionBadge, Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { HeroBookingWidget } from "./HeroBookingWidget";
import { toTelHref } from "@/utils/formatters";

interface HeroHomeSectionProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

const HERO_IMAGE =
  "/others/hero.jpg";

export function HeroHomeSection({ t, settings, locale }: HeroHomeSectionProps) {
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";

  const trustChips =
    locale === "de"
      ? ["§ 49 PBefG", "Festpreis", "Antwort in 30 Min"]
      : ["§ 49 PBefG", "Fixed price", "Reply within 30 min"];

  return (
    <section className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <div className="relative isolate overflow-hidden bg-[var(--color-text-primary)] text-[var(--color-text-on-strong)]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt={
              locale === "de"
                ? "Chauffeur-Service Fahrzeug vor Terminal"
                : "Chauffeur service vehicle near a terminal"
            }
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center] animate-hero-zoom"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,17,21,0.74)_0%,rgba(15,17,21,0.62)_38%,rgba(15,17,21,0.30)_66%,rgba(15,17,21,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.08)_0%,rgba(15,17,21,0.06)_40%,rgba(15,17,21,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_55%,rgba(15,17,21,0.42)_100%)]" />

        <Container className="relative flex items-center py-8 md:py-10 lg:min-h-[28rem]">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_24rem] lg:items-center xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="max-w-3xl animate-fade-up">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-secondary)]">
                {t("home.hero.pre_heading")}
              </p>
              <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.0] tracking-tight text-[var(--color-text-on-strong)] md:text-[46px] lg:text-[58px]">
                {t("home.hero.headline")}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[color:rgba(247,244,234,0.84)] md:text-[17px]">
                {t("home.hero.subhead")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={bookingHref}>
                  <Button
                    size="lg"
                    variant="primary"
                    trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    className="px-7 text-[12px] uppercase tracking-[0.16em]"
                  >
                    {t("home.hero.cta_book")}
                  </Button>
                </Link>
                <a href={toTelHref(settings.phone)}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[color:rgba(247,244,234,0.34)] bg-transparent px-7 text-[var(--color-text-on-strong)] hover:border-[color:var(--color-accent-primary)] hover:bg-[color:rgba(168,134,90,0.12)] hover:text-[var(--color-text-on-strong)]"
                  >
                    <span className="tabular-nums">{settings.phone}</span>
                  </Button>
                </a>
              </div>

              <ul className="mt-5 flex flex-wrap gap-2">
                {trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-1.5 border border-[color:rgba(194,166,117,0.4)] bg-[color:rgba(168,134,90,0.14)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-secondary)] backdrop-blur-sm"
                  >
                    <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
                    {chip}
                  </li>
                ))}
              </ul>

              <ConcessionBadge
                settings={settings}
                tone="dark"
                className="mt-5 self-start border-[color:rgba(247,244,234,0.2)] bg-[color:rgba(247,244,234,0.08)] px-4 py-2 text-[var(--color-accent-highlight)]"
              />
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
