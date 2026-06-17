import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Plane, ShieldCheck } from "lucide-react";
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

  const servicePoints = [
    {
      icon: Plane,
      label: locale === "de" ? "Flughafen" : "Airport",
      body:
        locale === "de"
          ? "Geplante Transfers mit Flugbeobachtung und klarer Abstimmung."
          : "Planned transfers with flight tracking and clear coordination.",
    },
    {
      icon: Clock3,
      label: locale === "de" ? "Rueckmeldung" : "Response",
      body:
        locale === "de"
          ? "Antwort innerhalb unserer Telefonzeiten."
          : "Reply during our phone hours.",
    },
    {
      icon: ShieldCheck,
      label: locale === "de" ? "Konzession" : "Licensed",
      body: settings.concession_number
        ? `§ 49 PBefG · ${settings.concession_number}`
        : locale === "de"
          ? "Konzessionierter Personenverkehr."
          : "Licensed passenger transport.",
    },
  ];

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
            className="object-cover object-[68%_center]"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,17,21,0.74)_0%,rgba(15,17,21,0.62)_38%,rgba(15,17,21,0.30)_66%,rgba(15,17,21,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.08)_0%,rgba(15,17,21,0.06)_40%,rgba(15,17,21,0.48)_100%)]" />

        <Container className="relative flex min-h-[calc(100svh-10rem)] items-center py-10 md:py-12 lg:min-h-[46rem] lg:py-16">
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

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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

              <p className="mt-4 text-[12px] font-medium tracking-[0.04em] text-[color:rgba(247,244,234,0.82)]">
                {locale === "de"
                  ? "§ 49 PBefG · Festpreis · Antwort in 30 Min"
                  : "§ 49 PBefG · Fixed price · Reply within 30 min"}
              </p>

              <ConcessionBadge
                settings={settings}
                tone="dark"
                className="mt-6 self-start border-[color:rgba(247,244,234,0.2)] bg-[color:rgba(247,244,234,0.08)] px-4 py-2 text-[var(--color-accent-highlight)]"
              />

              <div className="mt-8 grid max-w-2xl gap-4 border-t border-[color:rgba(247,244,234,0.18)] pt-6 md:grid-cols-3">
                {servicePoints.map((point) => (
                  <HeroPoint key={point.label} {...point} />
                ))}
              </div>
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

interface HeroPointProps {
  icon: typeof Plane;
  label: string;
  body: string;
}

function HeroPoint({ icon: Icon, label, body }: HeroPointProps) {
  return (
    <div className="flex gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[color:rgba(194,166,117,0.34)] bg-[color:rgba(168,134,90,0.18)] text-[var(--color-accent-secondary)]">
        <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-secondary)]">
          {label}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[color:rgba(247,244,234,0.88)]">
          {body}
        </p>
      </div>
    </div>
  );
}
