// apps/frontend/src/components/features/pricing/PricingSections.tsx
// Server sections for the pricing page. Prices render from pricing_items — the comparison row
// interpolates the live lowest fare rather than carrying its own copy. Exports getServiceHeroImage for PricingTabs.

import Link from "next/link";
import { Check, Banknote, CreditCard, FileText, Wallet, Globe, RotateCcw, ArrowRightLeft, Users } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale } from "@/types";
import { Container } from "@/components/shared";
import { formatPrice } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { resolveMediaUrl } from "@/utils/media-url";

const PRICING_HERO_FALLBACK_URL =
  "https://images.unsplash.com/photo-1686199948265-ddc4ebb1cc92?w=1800&q=80&auto=format&fit=crop";

const SERVICE_HERO_FALLBACKS: Record<string, string> = {
  flughafentransfer:
    "https://images.unsplash.com/photo-1620227134464-f879b1b93807?w=1800&q=80&auto=format&fit=crop",
  krankenhausfahrten:
    "https://images.unsplash.com/photo-1626058770278-b0abe39bedfd?w=1800&q=80&auto=format&fit=crop",
  "shuttle-service": PRICING_HERO_FALLBACK_URL,
  "airport-transfer":
    "https://images.unsplash.com/photo-1620227134464-f879b1b93807?w=1800&q=80&auto=format&fit=crop",
  "hospital-transport":
    "https://images.unsplash.com/photo-1626058770278-b0abe39bedfd?w=1800&q=80&auto=format&fit=crop",
};

export function getServiceHeroImage(slug: string, databaseUrl: string | null | undefined): string {
  if (databaseUrl && databaseUrl.trim()) return resolveMediaUrl(databaseUrl);
  return SERVICE_HERO_FALLBACKS[slug] ?? PRICING_HERO_FALLBACK_URL;
}



interface PricingTrustStripProps {
  t: TFunction;
  locale: Locale;
}

export function PricingTrustStrip({ t, locale }: PricingTrustStripProps) {
  const accent = pickT(
    t,
    "pricing.trust.accent",
    locale === "de" ? "Keine versteckten Aufschläge," : "No hidden surcharges,",
  );
  const before = pickT(
    t,
    "pricing.trust.before",
    locale === "de" ? "Transparente Preise vor Fahrtbeginn. " : "Transparent prices before departure. ",
  );
  const after = pickT(
    t,
    "pricing.trust.after",
    locale === "de"
      ? " kein Überraschungspreis am Zielort."
      : " no surprise total at the destination.",
  );
  const attribution = pickT(
    t,
    "pricing.trust.attribution",
    locale === "de" ? "— FAIR · SICHER · ZUVERLÄSSIG" : "— FAIR · SAFE · RELIABLE",
  );

  return (
    <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-accent-soft)] text-[var(--color-text-primary)]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(194, 166, 117, 0.14), transparent 70%)",
        }}
      />
      <Container className="relative z-10 py-20 text-center md:py-24">
        <span
          aria-hidden="true"
          className="mx-auto mb-7 block h-px w-11 bg-[var(--color-accent-primary)]"
        />
        <blockquote className="mx-auto max-w-3xl font-serif text-[28px] italic leading-[1.18] tracking-tight text-[var(--color-text-primary)] md:text-[44px]">
          “{before}
          <span className="not-italic text-[var(--color-accent-primary)]">{accent}</span>
          {after}”
        </blockquote>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
          {attribution}
        </p>
      </Container>
    </section>
  );
}

interface IncludedRow {
  key: string;
  defaults: { de: { label: string; desc: string }; en: { label: string; desc: string } };
}

const INCLUDED_ROWS: IncludedRow[] = [
  {
    key: "vat",
    defaults: {
      de: { label: "Gesetzliche MwSt.", desc: "— bei allen Personenfahrten bereits enthalten." },
      en: { label: "Statutory VAT", desc: "— already included in every passenger fare." },
    },
  },
  {
    key: "luggage",
    defaults: {
      de: { label: "Standardgepäck", desc: "— 1 Koffer + 1 Handgepäck pro Person." },
      en: { label: "Standard luggage", desc: "— 1 case + 1 cabin bag per person." },
    },
  },
  {
    key: "childseat",
    defaults: {
      de: { label: "Kindersitz oder Sitzerhöhung", desc: "— auf Anfrage." },
      en: { label: "Child seat or booster", desc: "— on request." },
    },
  },
  {
    key: "flighttrack",
    defaults: {
      de: { label: "Flugverfolgung", desc: "— wir passen die Abholzeit bei Verspätungen an." },
      en: { label: "Flight tracking", desc: "— we adjust pickup if your flight is delayed." },
    },
  },
];

interface PricingIncludedMomentProps {
  t: TFunction;
  locale: Locale;
}

export function PricingIncludedMoment({ t, locale }: PricingIncludedMomentProps) {
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
      <Container className="grid items-center gap-10 py-14 md:grid-cols-[5fr_7fr] md:gap-16 md:py-16">
        <div className="text-center md:text-left">
          <p
            aria-hidden="true"
            className="font-serif text-[160px] font-medium leading-[0.85] tracking-[-0.04em] text-[color:rgba(168,134,90,0.28)] md:text-[220px]"
          ></p>
          <span
            aria-hidden="true"
            className="mx-auto my-3.5 block h-0.5 w-20 bg-[var(--color-accent-primary)] md:mx-0"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-primary)]">
            {pickT(
              t,
              "pricing.included.big_caption",
              locale === "de" ? "MWST. INKLUSIVE" : "VAT INCLUDED",
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
            {pickT(
              t,
              "pricing.included.eyebrow",
              locale === "de" ? "Was Ihr Fahrpreis abdeckt" : "What your fare covers",
            )}
          </p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight tracking-tight text-[var(--color-text-primary)] md:text-[36px]">
            {pickT(
              t,
              "pricing.included.heading",
              locale === "de"
                ? "Klare Preise, keine versteckten Kosten."
                : "Clear prices, no hidden costs.",
            )}
          </h2>
          <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-[var(--color-text-secondary)] md:mt-4 md:text-[16px]">
            {pickT(
              t,
              "pricing.included.lead",
              locale === "de"
                ? "Alle Preise für Personenfahrten sind Endpreise inkl. gesetzlicher MwSt. und gelten pro Fahrzeug — für bis zu 4 Personen."
                : "All passenger prices are final prices incl. statutory VAT and apply per vehicle — for up to 4 persons.",
            )}
          </p>
          <ul className="mt-6 flex flex-col gap-3 md:gap-3.5">
            {INCLUDED_ROWS.map((row) => {
              const label = pickT(
                t,
                `pricing.included.${row.key}.label`,
                row.defaults[locale].label,
              );
              const desc = pickT(t, `pricing.included.${row.key}.desc`, row.defaults[locale].desc);
              return (
                <li key={row.key} className="flex items-start gap-3 text-[14px]">
                  <Check
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--color-accent-primary)]"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium text-[var(--color-text-primary)]">{label} </span>
                    <span className="text-[13.5px] text-[var(--color-text-secondary)]">{desc}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}

const EXCLUDED_ITEMS: { key: string; defaults: { de: string; en: string } }[] = [
  {
    key: "tolls",
    defaults: { de: "Mautgebühren (falls anwendbar)", en: "Toll fees (if applicable)" },
  },
  {
    key: "parking",
    defaults: { de: "Parkgebühren > 30 Min am Abholort", en: "Parking > 30 min at pickup" },
  },
  {
    key: "cleaning",
    defaults: { de: "Reinigungszuschlag bei Verschmutzung", en: "Cleaning surcharge if soiled" },
  },
  {
    key: "waiting",
    defaults: { de: "Wartezeit nach Tarif (pro Minute)", en: "Waiting time at tariff (per minute)" },
  },
];

interface PricingExcludedStripProps {
  t: TFunction;
  locale: Locale;
}

export function PricingExcludedStrip({ t, locale }: PricingExcludedStripProps) {
  const label = pickT(
    t,
    "pricing.excluded.label",
    locale === "de" ? "Separat berechnet" : "Charged separately",
  );
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="flex flex-wrap items-center gap-x-9 gap-y-3 py-9">
        <span className="inline-flex shrink-0 items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-warm)]">
          <span aria-hidden="true" className="block h-px w-5 bg-[var(--color-accent-warm)]" />
          {label}
        </span>
        <ul className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2">
          {EXCLUDED_ITEMS.map((item, idx) => (
            <li
              key={item.key}
              className="relative text-[13.5px] text-[var(--color-text-secondary)]"
            >
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-border-soft)]"
                >
                  ·
                </span>
              )}
              {pickT(t, `pricing.excluded.${item.key}`, item.defaults[locale])}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}


const DISCOUNT_ROWS: {
  key: string;
  Icon: typeof Check;
  defaults: { de: { label: string; desc: string }; en: { label: string; desc: string } };
}[] = [
  {
    key: "online",
    Icon: Globe,
    defaults: {
      de: { label: "Bis zu 5 % Rabatt", desc: "— wenn Sie online über step-now.de/buchen vorbestellen." },
      en: { label: "Up to 5% off", desc: "— when you pre-book online at step-now.de/buchen." },
    },
  },
  {
    key: "return",
    Icon: RotateCcw,
    defaults: {
      de: { label: "10 % Rabatt auf die Rückfahrt", desc: "— wenn Sie innerhalb einer Stunde mit uns zurückfahren." },
      en: { label: "10% off the return trip", desc: "— when you ride back with us within one hour." },
    },
  },
  {
    key: "oneway",
    Icon: ArrowRightLeft,
    defaults: {
      de: { label: "Je einfache Fahrt", desc: "— Hin- und Rückfahrt sind zwei getrennte Fahrten." },
      en: { label: "Per one-way trip", desc: "— outbound and return are two separate trips." },
    },
  },
  {
    key: "capacity",
    Icon: Users,
    defaults: {
      de: { label: "Bis zu 4 Personen", desc: "— Fahrzeugkapazität; eine eigene Preisstufe für mehr Personen gibt es nicht." },
      en: { label: "Up to 4 persons", desc: "— vehicle capacity; there is no separate price tier for more persons." },
    },
  },
];

interface PricingDiscountsProps {
  t: TFunction;
  locale: Locale;
}

/** Discounts and booking rules from the flyer + Preisliste "Hinweise". */
export function PricingDiscounts({ t, locale }: PricingDiscountsProps) {
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-12 md:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
          {pickT(t, "pricing.discounts.eyebrow", locale === "de" ? "Rabatte & Hinweise" : "Discounts & notes")}
        </p>
        <h2 className="mt-2 font-serif text-[30px] leading-tight tracking-tight text-[var(--color-text-primary)] md:text-[36px]">
          {pickT(t, "pricing.discounts.heading", locale === "de" ? "Vorbestellen lohnt sich." : "Booking ahead pays off.")}
        </h2>
        <ul className="mt-7 grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] sm:grid-cols-2 lg:grid-cols-4">
          {DISCOUNT_ROWS.map(({ key, Icon, defaults }) => (
            <li key={key} className="flex flex-col gap-2 bg-[var(--color-bg-surface)] px-5 py-5">
              <Icon className="h-5 w-5 text-[var(--color-accent-primary)]" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-serif text-[19px] font-medium leading-tight text-[var(--color-text-primary)]">
                {pickT(t, `pricing.discounts.${key}.label`, defaults[locale].label)}
              </span>
              <span className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(t, `pricing.discounts.${key}.desc`, defaults[locale].desc)}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

const COMPARISON_ROW_KEYS = ["row1", "row2", "row3", "row4", "row5"] as const;

interface PricingComparisonProps {
  t: TFunction;
  locale: Locale;
  /** Cheapest live route price; row 1 interpolates it so the table can never quote a stale figure. */
  lowestPrice?: string | null;
  lowestCurrency?: string;
}

export function PricingComparison({ t, locale, lowestPrice, lowestCurrency = "EUR" }: PricingComparisonProps) {
  const priceLabel = lowestPrice ? formatPrice(lowestPrice, locale, lowestCurrency) : null;
  const headLabel = pickT(
    t,
    "pricing.comparison.head_label",
    locale === "de" ? "Erlebnis" : "Experience",
  );
  const headTaxi = pickT(
    t,
    "pricing.comparison.head_taxi",
    locale === "de" ? "Normales Taxi" : "Standard taxi",
  );

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-14 md:py-16">
        <div className="mb-8 text-center md:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
            {pickT(
              t,
              "pricing.comparison.eyebrow",
              locale === "de"
                ? "Gleiche Fahrt — anderes Erlebnis"
                : "Same ride — different experience",
            )}
          </p>
          <h2 className="mt-2 font-serif text-[32px] leading-tight tracking-tight text-[var(--color-text-primary)] md:text-[38px]">
            {pickT(
              t,
              "pricing.comparison.heading",
              locale === "de" ? "StepNow vs. ein normales Taxi" : "StepNow vs. a standard taxi",
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-[var(--color-text-secondary)]">
            {pickT(
              t,
              "pricing.comparison.lead",
              locale === "de"
                ? "Der Unterschied liegt in dem, was Sie vor der Fahrt wissen."
                : "The difference is in what you know before the ride starts.",
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] md:grid-cols-3">
          <div className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)] md:px-6">
            {headLabel}
          </div>
          <div className="border-b border-[rgba(247,244,234,0.12)] bg-[var(--color-text-primary)] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-secondary)] md:px-6">
            StepNow
          </div>
          <div className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)] md:px-6">
            {headTaxi}
          </div>
          {COMPARISON_ROW_KEYS.map((key, idx) => {
            const isLast = idx === COMPARISON_ROW_KEYS.length - 1;
            const withPrice = (v: string) =>
              priceLabel ? v.replace("{price}", priceLabel) : v.replace(/\s*\{price\}/g, "");
            const labelText = withPrice(pickT(t, `pricing.comparison.${key}.label`, ""));
            const stepnowText = withPrice(pickT(t, `pricing.comparison.${key}.stepnow`, ""));
            const taxiText = withPrice(pickT(t, `pricing.comparison.${key}.taxi`, ""));
            if (!labelText && !stepnowText && !taxiText) return null;
            return (
              <div key={key} className="contents">
                <div
                  className={`bg-[var(--color-bg-surface)] px-5 py-4 text-[13.5px] text-[var(--color-text-primary)] md:px-6 ${isLast ? "" : "border-b border-[color:var(--color-border-soft)]"}`}
                >
                  {labelText}
                </div>
                <div
                  className={`bg-[var(--color-text-primary)] px-5 py-4 text-[13.5px] text-[var(--color-text-on-strong)] md:px-6 ${isLast ? "" : "border-b border-[rgba(247,244,234,0.12)]"}`}
                >
                  <span className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent-secondary)]"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span>{stepnowText}</span>
                  </span>
                </div>
                <div
                  className={`bg-[var(--color-bg-surface)] px-5 py-4 text-[13.5px] text-[var(--color-text-secondary)] md:px-6 ${isLast ? "" : "border-b border-[color:var(--color-border-soft)]"}`}
                >
                  {taxiText}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

const PAYMENT_METHODS = [
  { Icon: Banknote, key: "cash", defaults: { de: "Bar", en: "Cash" } },
  { Icon: CreditCard, key: "girocard", defaults: { de: "Girocard / EC", en: "Girocard / EC" } },
  { Icon: FileText, key: "invoice", defaults: { de: "Rechnung (B2B)", en: "Invoice (B2B)" } },
  { Icon: Wallet, key: "paypal", defaults: { de: "PayPal", en: "PayPal" } },
];

interface PricingPaymentCancellationProps {
  t: TFunction;
  locale: Locale;
  agbHref: string;
}

export function PricingPaymentCancellation({
  t,
  locale,
  agbHref,
}: PricingPaymentCancellationProps) {
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
      <Container className="grid items-start gap-7 py-10 md:grid-cols-[5fr_7fr] md:gap-14">
        <div className="flex flex-col items-start gap-3 md:flex-row md:gap-6">
          <div className="md:min-w-[140px] md:shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
              {pickT(t, "pricing.payment.eyebrow", locale === "de" ? "Bezahlung" : "Payment")}
            </p>
            <h3 className="mt-1 font-serif text-[19px] font-medium leading-tight tracking-tight text-[var(--color-text-primary)]">
              {pickT(
                t,
                "pricing.payment.heading",
                locale === "de" ? "So zahlen Sie" : "How to pay",
              )}
            </h3>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {PAYMENT_METHODS.map(({ Icon, key, defaults }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-primary)]"
              >
                <Icon
                  className="h-3.5 w-3.5 text-[var(--color-accent-primary)]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {pickT(t, `pricing.payment.${key}`, defaults[locale])}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 md:flex-row md:gap-6">
          <div className="md:min-w-[140px] md:shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
              {pickT(
                t,
                "pricing.cancellation.eyebrow",
                locale === "de" ? "Stornierung" : "Cancellation",
              )}
            </p>
            <h3 className="mt-1 font-serif text-[19px] font-medium leading-tight tracking-tight text-[var(--color-text-primary)]">
              {pickT(
                t,
                "pricing.cancellation.heading",
                locale === "de" ? "Faire Bedingungen" : "Fair terms",
              )}
            </h3>
          </div>
          <div className="flex-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            <p className="mb-2.5">
              {pickT(
                t,
                "pricing.cancellation.body",
                locale === "de"
                  ? "Planänderung? Sagen Sie Ihre Fahrt bitte so früh wie möglich ab — telefonisch, per WhatsApp oder E-Mail. Es gelten unsere Allgemeinen Geschäftsbedingungen."
                  : "Change of plans? Please cancel your ride as early as possible — by phone, WhatsApp or email. Our general terms and conditions apply.",
              )}
            </p>
            <Link
              href={agbHref}
              className="inline-block border-b border-[rgba(168,134,90,0.32)] pb-0.5 text-[11.5px] font-medium text-[var(--color-accent-primary)] transition-colors hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]"
            >
              {pickT(
                t,
                "pricing.cancellation.full_terms",
                locale === "de" ? "Vollständige AGB ansehen →" : "See full terms (AGB) →",
              )}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
