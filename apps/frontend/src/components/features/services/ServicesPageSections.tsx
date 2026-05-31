// apps/frontend/src/components/features/services/ServicesPageSections.tsx
// Tier 4 magazine-spread sections: ServicesIndex, ServiceRichRow, HowItWorksBeat, ServicesEditorialClose.

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plane,
  HeartPulse,
  GraduationCap,
  Users,
  Calendar,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic, ServicePublic } from "@/types";
import { Container } from "@/components/shared";
import { formatPrice } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";
import { getServiceHeroImage } from "@/components/features/pricing/PricingSections";

export interface ServiceWithPricing {
  service: ServicePublic;
  lowestPrice: string | null;
  lowestRouteLabel: string | null;
}

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  flughafentransfer: Plane,
  "airport-transfer": Plane,
  krankenhausfahrten: HeartPulse,
  "hospital-transport": HeartPulse,
  schuelerbefoerderung: GraduationCap,
  "school-transport": GraduationCap,
  "shuttle-service": Users,
};

export function findLowestPrice(categories: PricingCategoryPublic[]): {
  price: string | null;
  routeLabel: string | null;
} {
  let cheapest: { price: number; raw: string; label: string } | null = null;
  for (const c of categories) {
    for (const item of c.items) {
      const num = Number(item.price_eur);
      if (Number.isNaN(num)) continue;
      const label =
        item.from_location && item.to_location
          ? `${item.from_location} → ${item.to_location}`
          : (item.from_location ?? item.to_location ?? "");
      if (!cheapest || num < cheapest.price) {
        cheapest = { price: num, raw: item.price_eur, label };
      }
    }
  }
  if (!cheapest) return { price: null, routeLabel: null };
  return { price: cheapest.raw, routeLabel: cheapest.label || null };
}

function firstParagraph(md: string | null | undefined): string | null {
  if (!md) return null;
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`]/g, "")
    .trim();
  const para = stripped.split(/\n{2,}/)[0]?.trim();
  if (!para) return null;
  return para.length > 280 ? `${para.slice(0, 280).trim()}…` : para;
}

// ServicesIndex ───────────────────────────────────────────────────────────────

export function ServicesIndex({
  t,
  locale,
  data,
}: {
  t: TFunction;
  locale: Locale;
  data: ServiceWithPricing[];
}) {
  if (data.length === 0) return null;

  return (
    <section className="border-y border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
      <Container className="py-7 md:py-8">
        <p className="mb-4 flex items-center gap-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
          {pickT(t, "services.index.eyebrow", locale === "de" ? "Im Überblick" : "At a glance")}
          <span
            aria-hidden="true"
            className="block h-px flex-1 bg-[color:var(--color-border-soft)]"
          />
        </p>
        <div className="grid grid-cols-1 border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] sm:grid-cols-2 lg:grid-cols-4">
          {data.map(({ service, lowestPrice }, idx) => {
            const Icon = ICON_BY_SLUG[service.slug] ?? Plane;
            const number = String(idx + 1).padStart(2, "0");
            return (
              <a
                key={service.id}
                href={`#${service.slug}`}
                className={cn(
                  "group flex flex-col gap-1 bg-[var(--color-bg-page)] px-5 py-5 transition-colors duration-base hover:bg-[var(--color-bg-surface)] md:px-6",
                  "sm:border-r sm:border-[color:var(--color-border-soft)] sm:[&:nth-child(2n)]:border-r-0",
                  "lg:[&:last-child]:border-r-0 lg:[&:nth-child(-n+3)]:border-r lg:[&:nth-child(-n+3)]:border-[color:var(--color-border-soft)] lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(2n)]:border-[color:var(--color-border-soft)]",
                  idx < data.length - 1 &&
                    "border-b border-[color:var(--color-border-soft)] lg:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Icon
                    className="h-6 w-6 text-[var(--color-accent-primary)] md:h-7 md:w-7"
                    strokeWidth={1.4}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-semibold uppercase tabular-nums tracking-[0.18em] text-[var(--color-text-secondary)]">
                    {number}
                  </span>
                </div>
                <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight md:text-[22px]">
                  {service.title}
                </h3>
                <div className="mt-auto flex items-baseline gap-1.5 border-t border-[color:var(--color-border-soft)] pt-3">
                  {lowestPrice ? (
                    <>
                      <span className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                        {locale === "de" ? "Ab" : "From"}
                      </span>
                      <span className="font-serif text-[20px] font-medium tabular-nums text-[var(--color-accent-primary)] md:text-[22px]">
                        {formatPrice(lowestPrice, locale)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-primary)]">
                      {locale === "de" ? "Auf Anfrage" : "On request"}
                    </span>
                  )}
                </div>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)] transition-colors group-hover:text-[var(--color-text-primary)]">
                  {locale === "de" ? "Mehr lesen" : "Read more"}
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ServiceRichRow ──────────────────────────────────────────────────────────────

const IMAGE_TAGS: Record<string, { de: string; en: string }> = {
  flughafentransfer: { de: "Beliebteste Buchung", en: "Most booked" },
  "airport-transfer": { de: "Beliebteste Buchung", en: "Most booked" },
  krankenhausfahrten: { de: "Nicht-Notfall", en: "Non-emergency" },
  "hospital-transport": { de: "Nicht-Notfall", en: "Non-emergency" },
  schuelerbefoerderung: { de: "Für Familien", en: "For families" },
  "school-transport": { de: "Für Familien", en: "For families" },
  "shuttle-service": { de: "Gruppentransfers", en: "Group transfers" },
};

interface DiffSpec {
  Icon: LucideIcon;
  labelKey: string;
  bodyKey: string;
  defaults: {
    de: { label: string; body: string };
    en: { label: string; body: string };
  };
}

const DIFFERENTIATORS: Record<string, DiffSpec> = {
  flughafentransfer: {
    Icon: Check,
    labelKey: "services.row.flughafentransfer.diff_label",
    bodyKey: "services.row.flughafentransfer.diff_body",
    defaults: {
      de: {
        label: "60 Minuten Wartezeit",
        body: "bei Flughafenabholungen — der Fahrer verfolgt Ihren Flug und passt die Zeit automatisch an.",
      },
      en: {
        label: "60 minutes waiting included",
        body: "for airport pickups — your driver tracks your flight and adjusts automatically.",
      },
    },
  },
  "airport-transfer": {
    Icon: Check,
    labelKey: "services.row.airport-transfer.diff_label",
    bodyKey: "services.row.airport-transfer.diff_body",
    defaults: {
      de: {
        label: "60 Minuten Wartezeit",
        body: "bei Flughafenabholungen — der Fahrer verfolgt Ihren Flug und passt die Zeit automatisch an.",
      },
      en: {
        label: "60 minutes waiting included",
        body: "for airport pickups — your driver tracks your flight and adjusts automatically.",
      },
    },
  },
  krankenhausfahrten: {
    Icon: Clock,
    labelKey: "services.row.krankenhausfahrten.diff_label",
    bodyKey: "services.row.krankenhausfahrten.diff_body",
    defaults: {
      de: {
        label: "Geschult in Begleitung",
        body: "— Tür-zu-Tür-Abholung, Hilfe mit Gepäck und Gehhilfen, optionale Wartezeit bei kurzen Terminen.",
      },
      en: {
        label: "Trained for assistance",
        body: "— door-to-door pickup, support with bags and walking aids, optional wait time during short appointments.",
      },
    },
  },
  "hospital-transport": {
    Icon: Clock,
    labelKey: "services.row.hospital-transport.diff_label",
    bodyKey: "services.row.hospital-transport.diff_body",
    defaults: {
      de: {
        label: "Geschult in Begleitung",
        body: "— Tür-zu-Tür-Abholung, Hilfe mit Gepäck und Gehhilfen, optionale Wartezeit bei kurzen Terminen.",
      },
      en: {
        label: "Trained for assistance",
        body: "— door-to-door pickup, support with bags and walking aids, optional wait time during short appointments.",
      },
    },
  },
  schuelerbefoerderung: {
    Icon: Calendar,
    labelKey: "services.row.schuelerbefoerderung.diff_label",
    bodyKey: "services.row.schuelerbefoerderung.diff_body",
    defaults: {
      de: {
        label: "Abonnement verfügbar",
        body: "— Mo–Fr Blockbuchungen mit demselben Fahrer, monatliche Abrechnung, in Schulferien automatisch pausiert.",
      },
      en: {
        label: "Subscription available",
        body: "— Monday–Friday block bookings with the same driver, billed monthly, paused for school holidays automatically.",
      },
    },
  },
  "school-transport": {
    Icon: Calendar,
    labelKey: "services.row.school-transport.diff_label",
    bodyKey: "services.row.school-transport.diff_body",
    defaults: {
      de: {
        label: "Abonnement verfügbar",
        body: "— Mo–Fr Blockbuchungen mit demselben Fahrer, monatliche Abrechnung, in Schulferien automatisch pausiert.",
      },
      en: {
        label: "Subscription available",
        body: "— Monday–Friday block bookings with the same driver, billed monthly, paused for school holidays automatically.",
      },
    },
  },
  "shuttle-service": {
    Icon: Users,
    labelKey: "services.row.shuttle-service.diff_label",
    bodyKey: "services.row.shuttle-service.diff_body",
    defaults: {
      de: {
        label: "Bis zu 8 Fahrgäste",
        body: "in einem Fahrzeug. Single-Driver-Koordination — eine Telefonnummer für die gesamte Fahrt, auch bei mehreren Abholpunkten.",
      },
      en: {
        label: "Up to 8 passengers",
        body: "in one vehicle. Single-driver coordination — one phone number for the whole journey, even with multiple pickups.",
      },
    },
  },
};

export function ServiceRichRow({
  t,
  locale,
  service,
  index,
  detailHref,
  lowestPrice,
  lowestRouteLabel,
}: {
  t: TFunction;
  locale: Locale;
  service: ServicePublic;
  index: number;
  detailHref: string;
  lowestPrice: string | null;
  lowestRouteLabel: string | null;
}) {
  const isReversed = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");
  const heroUrl = getServiceHeroImage(service.slug, service.hero_image_url);
  const tag = IMAGE_TAGS[service.slug]?.[locale];
  const diff = DIFFERENTIATORS[service.slug];
  const excerpt = firstParagraph(service.long_description);

  return (
    <section
      id={service.slug}
      className="scroll-mt-20 border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]"
    >
      <Container
        className={cn(
          "grid items-center gap-10 py-16 md:py-20",
          isReversed ? "md:grid-cols-[7fr_5fr]" : "md:grid-cols-[5fr_7fr]",
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]",
            isReversed && "md:order-2",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
          />
          {tag && (
            <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 bg-[color:rgba(255,253,248,0.94)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-primary)] backdrop-blur-sm">
              <span aria-hidden="true" className="block h-1 w-1 bg-[var(--color-accent-primary)]" />
              {tag}
            </span>
          )}
        </div>

        <div className={cn("flex flex-col gap-3.5", isReversed && "md:order-1")}>
          <p className="flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
            <span className="font-serif text-[14px] italic tracking-normal text-[var(--color-accent-secondary)]">
              {number}
            </span>
            <span aria-hidden="true" className="block h-px w-7 bg-[var(--color-accent-primary)]" />
            <span>{service.title}</span>
          </p>
          <h2 className="font-serif text-[40px] leading-[1.02] tracking-tight text-[var(--color-text-primary)] md:text-[52px]">
            {service.short_description ?? service.title}
          </h2>
          {excerpt && (
            <p className="mt-1 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">
              {excerpt}
            </p>
          )}
          {diff && (
            <div className="mt-2 flex max-w-xl items-start gap-3 border-l-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-surface)] px-4 py-3.5">
              <diff.Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-primary)]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {pickT(t, diff.labelKey, diff.defaults[locale].label)}
                </span>{" "}
                <span className="text-[var(--color-text-secondary)]">
                  {pickT(t, diff.bodyKey, diff.defaults[locale].body)}
                </span>
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 border border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] px-5 py-3 text-[13px] font-medium text-[var(--color-text-on-strong)] transition-colors duration-base hover:border-[var(--color-bg-strong-hover)] hover:bg-[var(--color-bg-strong-hover)]"
            >
              {pickT(
                t,
                "services.card.learn_more",
                locale === "de" ? "Mehr erfahren" : "Read more",
              )}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            {lowestPrice && (
              <span className="flex items-baseline gap-2">
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  {lowestRouteLabel
                    ? `${lowestRouteLabel} ${locale === "de" ? "ab" : "from"}`
                    : locale === "de"
                      ? "Ab"
                      : "From"}
                </span>
                <span className="font-serif text-[20px] font-medium tabular-nums text-[var(--color-accent-primary)]">
                  {formatPrice(lowestPrice, locale)}
                </span>
              </span>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

// HowItWorksBeat ──────────────────────────────────────────────────────────────

interface HiwStep {
  num: string;
  headingKey: string;
  bodyKey: string;
  Icon: LucideIcon;
  defaults: {
    de: { heading: string; body: string };
    en: { heading: string; body: string };
  };
}

const HIW_STEPS: HiwStep[] = [
  {
    num: "01",
    headingKey: "services.hiw.step1.heading",
    bodyKey: "services.hiw.step1.body",
    Icon: Calendar,
    defaults: {
      de: {
        heading: "Route und Datum senden",
        body: "Per Webformular, Telefon oder WhatsApp. Geben Sie Zeit, Abholort und Ziel an — wir kümmern uns um den Rest.",
      },
      en: {
        heading: "Send your route and date",
        body: "By web form, phone, or WhatsApp. Include the time, the pickup point, and the destination — we'll handle the rest.",
      },
    },
  },
  {
    num: "02",
    headingKey: "services.hiw.step2.heading",
    bodyKey: "services.hiw.step2.body",
    Icon: Check,
    defaults: {
      de: {
        heading: "Pauschalpreis innerhalb von 30 Min",
        body: "Während der Telefonzeiten bestätigen wir den Pauschalpreis, den Fahrer und das Fahrzeug. Ab diesem Moment ist der Preis fixiert.",
      },
      en: {
        heading: "Fixed price within 30 min",
        body: "During phone hours, we confirm the fixed price, the driver, and the vehicle. The price is locked from that moment on.",
      },
    },
  },
  {
    num: "03",
    headingKey: "services.hiw.step3.heading",
    bodyKey: "services.hiw.step3.body",
    Icon: Clock,
    defaults: {
      de: {
        heading: "Der Fahrer ist schon da",
        body: "Kein Heranrufen, keine App-Dispatch, kein Surge. Der bestätigte Pauschalpreis ist der Preis, den Sie zahlen — auch im Stau, auch an Feiertagen.",
      },
      en: {
        heading: "The driver is already there",
        body: "No hailing, no app dispatch, no surge. The Pauschalpreis you confirmed is the Pauschalpreis you pay — same in traffic, same on holidays.",
      },
    },
  },
];

export function HowItWorksBeat({ t, locale }: { t: TFunction; locale: Locale }) {
  return (
    <section className="border-y border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
          <div className="grid gap-8 border-b border-[color:var(--color-border-soft)] px-6 py-7 md:px-8 md:py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(
                  t,
                  "services.hiw.eyebrow",
                  locale === "de" ? "So funktioniert's" : "How it works",
                )}
              </p>
              <h2 className="mt-3 max-w-2xl font-serif text-section text-[var(--color-text-primary)] md:text-display-md">
                {pickT(
                  t,
                  "services.hiw.heading_part1",
                  locale === "de" ? "Drei Schritte," : "Three steps,",
                )}{" "}
                <span className="italic text-[var(--color-accent-primary)]">
                  {pickT(
                    t,
                    "services.hiw.heading_part2",
                    locale === "de" ? "keine Überraschungen." : "no surprises.",
                  )}
                </span>
              </h2>
            </div>

            <div className="flex items-start gap-3 lg:max-w-sm lg:justify-self-end">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "services.hiw.summary",
                  locale === "de"
                    ? "Kurze Anfrage, klare Bestätigung und planbare Fahrt. Ohne unnötige Zwischenschritte."
                    : "A short request, clear confirmation, and a predictable ride. No unnecessary back-and-forth.",
                )}
              </p>
            </div>
          </div>

          <ol className="grid gap-px bg-[color:var(--color-border-soft)] md:grid-cols-3">
            {HIW_STEPS.map((step) => (
              <li key={step.num} className="bg-[var(--color-bg-surface)]">
                <article className="flex h-full flex-col p-6 md:p-8">
                  <div className="items-end. flex justify-between gap-4">
                    <span className="font-serif text-[40px] leading-none tracking-tight text-[color:rgba(85,133,24,0.34)] md:text-[56px]">
                      {step.num}
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                      <step.Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-8 border-t border-[color:var(--color-border-soft)] pt-5">
                    <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[24px]">
                      {pickT(t, step.headingKey, step.defaults[locale].heading)}
                    </h3>
                    <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                      {pickT(t, step.bodyKey, step.defaults[locale].body)}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

// ServicesEditorialClose ─────────────────────────────────────────────────────

export function ServicesEditorialClose({
  t,
  locale,
  settings,
  pricingHref,
}: {
  t: TFunction;
  locale: Locale;
  settings: { concession_number: string | null };
  pricingHref: string;
}) {
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-14 text-center md:py-16">
        <span
          aria-hidden="true"
          className="mx-auto mb-6 block h-px w-9 bg-[var(--color-accent-primary)]"
        />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-primary)]">
          {pickT(
            t,
            "services.close.eyebrow",
            locale === "de" ? "Fünf Services, ein Standard" : "Five services, one standard",
          )}
        </p>
        <p className="mx-auto mt-4 max-w-3xl font-serif text-[26px] italic leading-[1.18] tracking-tight text-[var(--color-text-primary)] md:text-[34px]">
          {pickT(
            t,
            "services.close.statement_part1",
            locale === "de" ? "Jede Fahrt beginnt mit einem " : "Every ride starts with a ",
          )}
          <span className="not-italic text-[var(--color-accent-primary)]">
            {pickT(
              t,
              "services.close.statement_accent",
              locale === "de" ? "Preis, den Sie sehen" : "price you can see",
            )}
          </span>
          {pickT(
            t,
            "services.close.statement_part2",
            locale === "de"
              ? ", einem Fahrer, den Sie namentlich kennen, und einer Route, die vor der Abfahrt bestätigt ist."
              : ", a driver you can name, and a route confirmed before you leave home.",
          )}
        </p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-text-secondary)]">
          <span className="text-[var(--color-accent-primary)]">
            § 49 PBefG{settings.concession_number ? ` · ${settings.concession_number}` : ""}
          </span>{" "}
          ·{" "}
          {pickT(
            t,
            "services.close.attribution",
            locale === "de"
              ? "KONZESSIONIERTER PERSONENVERKEHR · REGION STUTTGART"
              : "LICENSED PASSENGER TRANSPORT · Plochingen/Esslingen",
          )}
        </p>
        <p className="mt-7 text-[13px] text-[var(--color-text-secondary)]">
          {pickT(
            t,
            "services.close.followup_lead",
            locale === "de" ? "Pauschalpreis ansehen?" : "Looking for fixed-price routes?",
          )}{" "}
          <Link
            href={pricingHref}
            className="ml-1 inline-block border-b border-[rgba(85,133,24,0.3)] pb-0.5 font-medium text-[var(--color-accent-primary)] transition-colors hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]"
          >
            {pickT(
              t,
              "services.close.followup_link",
              locale === "de" ? "Vollständige Preise →" : "See full pricing →",
            )}
          </Link>
        </p>
      </Container>
    </section>
  );
}
