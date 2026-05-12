// apps/frontend/src/components/features/pricing/PricingSections.tsx
// Tier 5 Pricing — all server-side sections + fallback image constants
// consolidated into one file. The only sibling is PricingTabs.tsx, which has
// to live separately because it's a client component ("use client").
//
// Exports (top to bottom of the page):
//   • PricingFeaturedHero       — dark band with most-booked route + €price
//   • PricingTrustStrip         — italic serif blockquote on ink
//   • PricingIncludedMoment     — oversized "19%" + included list (paper bg)
//   • PricingExcludedStrip      — single horizontal "Charged separately"
//   • PricingComparison         — StepNow vs Standard taxi (3-col grid)
//   • PricingPaymentCancellation — payment pills + 3-step cancellation ladder
//
// Also exports getServiceHeroImage() used by PricingTabs.

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Banknote,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingItemPublic, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";

// ============================================================================
// FALLBACK IMAGE URLS
// ----------------------------------------------------------------------------
// Used when services.hero_image_url is null/empty. These are verified Unsplash
// URLs hot-linked from images.unsplash.com — they render fine in development
// and during pre-launch when Naeem has not uploaded real photos yet.
//
// ⚠️ Before production launch, Naeem should upload his own photos via
// /admin/services so the live site is fully DSGVO-compliant and self-hosted
// from Hetzner (no third-party CDN requests on customer pages).
//
// All URLs verified against Unsplash CDN. Each is curated for the brand:
// black sedans, neutral environments, no identifiable subjects, premium feel.
// ============================================================================

/** Featured-route hero photo (also the ultimate fallback for any service). */
const PRICING_HERO_FALLBACK_URL =
  "https://images.unsplash.com/photo-1686199948265-ddc4ebb1cc92?w=1800&q=80&auto=format&fit=crop";

/** Per-service tab fallbacks. Keyed by both DE and EN slugs. */
const SERVICE_HERO_FALLBACKS: Record<string, string> = {
  // DE slugs (primary)
  flughafentransfer:
    "https://images.unsplash.com/photo-1620227134464-f879b1b93807?w=1800&q=80&auto=format&fit=crop",
  krankenhausfahrten:
    "https://images.unsplash.com/photo-1626058770278-b0abe39bedfd?w=1800&q=80&auto=format&fit=crop",
  schuelerbefoerderung:
    "https://images.unsplash.com/photo-1471174617910-3e9c04f58ff5?w=1800&q=80&auto=format&fit=crop",
  "shuttle-service": PRICING_HERO_FALLBACK_URL,
  // EN slugs (aliases — same image)
  "airport-transfer":
    "https://images.unsplash.com/photo-1620227134464-f879b1b93807?w=1800&q=80&auto=format&fit=crop",
  "hospital-transport":
    "https://images.unsplash.com/photo-1626058770278-b0abe39bedfd?w=1800&q=80&auto=format&fit=crop",
  "school-transport":
    "https://images.unsplash.com/photo-1471174617910-3e9c04f58ff5?w=1800&q=80&auto=format&fit=crop",
};

/** Pick the best hero image: DB → per-slug fallback → featured-route fallback. */
export function getServiceHeroImage(
  slug: string,
  databaseUrl: string | null | undefined,
): string {
  if (databaseUrl && databaseUrl.trim()) return databaseUrl;
  return SERVICE_HERO_FALLBACKS[slug] ?? PRICING_HERO_FALLBACK_URL;
}

function getFeaturedHeroImage(firstServiceImageUrl: string | null | undefined): string {
  if (firstServiceImageUrl && firstServiceImageUrl.trim()) return firstServiceImageUrl;
  return PRICING_HERO_FALLBACK_URL;
}

// ============================================================================
// 1. FEATURED ROUTE HERO
// ----------------------------------------------------------------------------
// Dark band sitting below the page header. Left: eyebrow + serif route name +
// 3 proof points + Book CTA. Right: oversized serif price (e.g. €70).
// Photo behind via plain <img> (avoids forcing images.unsplash.com into
// next.config.mjs remotePatterns, which would weaken the DSGVO posture).
// ============================================================================

interface PricingFeaturedHeroProps {
  t: TFunction;
  locale: Locale;
  settings: SettingsPublic;
  featuredItem: PricingItemPublic | null;
  backgroundImageUrl: string | null | undefined;
  bookingHref: string;
}

export function PricingFeaturedHero({
  t,
  locale,
  settings,
  featuredItem,
  backgroundImageUrl,
  bookingHref,
}: PricingFeaturedHeroProps) {
  if (!featuredItem) return null;

  const imageUrl = getFeaturedHeroImage(backgroundImageUrl);
  const priceNumeric = Number(featuredItem.price_eur);
  const proofPoints = [
    pickT(t, "pricing.hero.proof_1", locale === "de" ? "Festpreis vor der Fahrt" : "Fixed price before departure"),
    pickT(t, "pricing.hero.proof_2", locale === "de" ? "60 Min. Wartezeit inkl." : "60 min waiting included"),
    pickT(t, "pricing.hero.proof_3", locale === "de" ? "Flugverfolgung" : "Flight tracking"),
  ];

  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/40"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-100px] bottom-[-100px] h-[500px] w-[700px] opacity-70 blur-sm"
        style={{
          background:
            "radial-gradient(circle at 80% 30%, rgba(168, 134, 90, 0.22), transparent 50%)",
        }}
      />
      <Container className="relative z-10 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
          {/* Left — eyebrow + route + proofs + CTA */}
          <div>
            <span className="inline-flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-gold">
              <span aria-hidden="true" className="block h-px w-6 bg-gold" />
              {pickT(t, "pricing.hero.eyebrow", locale === "de" ? "Beliebteste Strecke" : "Most booked route")}
            </span>
            <h2 className="mt-3 font-serif text-[36px] leading-[1.02] tracking-tight text-cream md:text-[52px]">
              {featuredItem.from_location}
              <span className="mx-3 text-gold md:mx-4">→</span>
              {featuredItem.to_location}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 md:mt-7">
              {proofPoints.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13px] text-cream/80">
                  <Check className="h-3.5 w-3.5 text-gold" strokeWidth={2} aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-5 md:mt-8">
              <Link
                href={bookingHref}
                className="inline-flex items-center gap-2 bg-cream px-6 py-3.5 text-[13px] font-medium tracking-tight text-ink transition-colors duration-base hover:bg-paper"
              >
                {pickT(t, "pricing.hero.cta_book", locale === "de" ? "Diese Strecke buchen" : "Book this route")}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </Link>
              <a
                href={toTelHref(settings.phone)}
                className="border-b border-cream/30 pb-0.5 text-[13.5px] tabular-nums text-cream transition-colors hover:border-cream"
              >
                {locale === "de" ? "oder anrufen" : "or call"} {settings.phone}
              </a>
            </div>
          </div>
          {/* Right — oversized price */}
          <div className="text-left md:text-right">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold/85">
              {pickT(t, "pricing.hero.price_label", locale === "de" ? "Festpreis ab" : "Fixed from")}
            </p>
            <p className="my-2 block font-serif text-[110px] leading-none tracking-[-0.04em] text-cream md:text-[140px]">
              <span className="text-gold align-[0.18em] text-[0.65em] mr-1">€</span>
              {Math.round(priceNumeric)}
            </p>
            <p className="text-[11.5px] uppercase tracking-[0.18em] text-cream/55">
              {pickT(
                t,
                "pricing.hero.price_detail",
                locale === "de" ? "Pro Fahrzeug · bis zu 4 Personen" : "Per vehicle · up to 4 pax",
              )}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ============================================================================
// 2. TRUST STRIP
// ----------------------------------------------------------------------------
// Full-bleed ink band acting as a visual palette cleanser between tables and
// the "19%" moment. One italic serif blockquote with a gold-accented phrase.
// ============================================================================

interface PricingTrustStripProps {
  t: TFunction;
  locale: Locale;
}

export function PricingTrustStrip({ t, locale }: PricingTrustStripProps) {
  const accent = pickT(t, "pricing.trust.accent", locale === "de" ? "Keine Taximeter," : "No taximeter,");
  const before = pickT(t, "pricing.trust.before", locale === "de" ? "Festpreis vor Fahrtbeginn. " : "Fixed price before departure. ");
  const after = pickT(
    t,
    "pricing.trust.after",
    locale === "de"
      ? " keine versteckten Aufschläge, kein Überraschungspreis am Zielort."
      : " no hidden surcharges, no surprise total at the destination.",
  );
  const attribution = pickT(
    t,
    "pricing.trust.attribution",
    locale === "de" ? "— UNSERE GARANTIE, GESCHÜTZT DURCH § 49 PBEFG" : "— OUR GUARANTEE, BACKED BY § 49 PBEFG",
  );

  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, rgba(168, 134, 90, 0.12), transparent 70%)" }}
      />
      <Container className="relative z-10 py-20 text-center md:py-24">
        <span aria-hidden="true" className="mx-auto mb-7 block h-px w-11 bg-gold" />
        <blockquote className="mx-auto max-w-3xl font-serif text-[28px] italic leading-[1.18] tracking-tight text-cream md:text-[44px]">
          “{before}
          <span className="not-italic text-gold">{accent}</span>
          {after}”
        </blockquote>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/85">
          {attribution}
        </p>
      </Container>
    </section>
  );
}

// ============================================================================
// 3. INCLUDED MOMENT — oversized "19%" + included list
// ============================================================================

interface IncludedRow {
  key: string;
  defaults: { de: { label: string; desc: string }; en: { label: string; desc: string } };
}

const INCLUDED_ROWS: IncludedRow[] = [
  {
    key: "luggage",
    defaults: {
      de: { label: "Standardgepäck", desc: "— 1 Koffer + 1 Handgepäck pro Fahrgast." },
      en: { label: "Standard luggage", desc: "— 1 case + 1 cabin bag per passenger." },
    },
  },
  {
    key: "waiting",
    defaults: {
      de: { label: "15 Minuten Wartezeit", desc: "— 60 Minuten am Flughafen mit Meet & Greet." },
      en: { label: "15 minutes waiting time", desc: "— 60 minutes for airport meet & greet." },
    },
  },
  {
    key: "childseat",
    defaults: {
      de: { label: "Kindersitz oder Sitzerhöhung", desc: "— auf Anfrage, kostenfrei." },
      en: { label: "Child seat or booster", desc: "— on request, free of charge." },
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
    <section className="border-b border-line bg-paper">
      <Container className="grid items-center gap-10 py-14 md:grid-cols-[5fr_7fr] md:gap-16 md:py-16">
        {/* Display "19%" */}
        <div className="text-center md:text-left">
          <p
            aria-hidden="true"
            className="font-serif font-medium leading-[0.85] tracking-[-0.04em] text-gold-deep text-[160px] md:text-[220px]"
          >
            19%
          </p>
          <span aria-hidden="true" className="my-3.5 mx-auto block h-0.5 w-20 bg-gold md:mx-0" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-deep">
            {pickT(t, "pricing.included.big_caption", locale === "de" ? "MwSt. · IMMER INKLUDIERT" : "VAT · ALWAYS INCLUDED")}
          </p>
        </div>
        {/* Editorial */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
            {pickT(t, "pricing.included.eyebrow", locale === "de" ? "Was Ihr Festpreis abdeckt" : "What your fixed price covers")}
          </p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight tracking-tight md:text-[36px]">
            {pickT(
              t,
              "pricing.included.heading",
              locale === "de" ? "Der Preis, den Sie sehen, ist der Preis, den Sie zahlen." : "The price you see is the price you pay.",
            )}
          </h2>
          <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-mute md:mt-4 md:text-[16px]">
            {pickT(
              t,
              "pricing.included.lead",
              locale === "de"
                ? "Jeder Festpreis enthält die deutsche Mehrwertsteuer, Standardgepäck, Wartezeit am Abholort und Kindersitz auf Anfrage — ohne Aufpreis. Nichts wird am Zielort hinzugefügt."
                : "Every quote includes German VAT, standard luggage, waiting time at pickup, and child seat on request — at no extra charge. Nothing added at the destination.",
            )}
          </p>
          <ul className="mt-6 flex flex-col gap-3 md:gap-3.5">
            {INCLUDED_ROWS.map((row) => {
              const label = pickT(t, `pricing.included.${row.key}.label`, row.defaults[locale].label);
              const desc = pickT(t, `pricing.included.${row.key}.desc`, row.defaults[locale].desc);
              return (
                <li key={row.key} className="flex items-start gap-3 text-[14px]">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                  <span>
                    <span className="font-medium text-ink">{label} </span>
                    <span className="text-[13.5px] text-mute">{desc}</span>
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

// ============================================================================
// 4. EXCLUDED STRIP — single horizontal row of not-included items
// ============================================================================

const EXCLUDED_ITEMS: { key: string; defaults: { de: string; en: string } }[] = [
  { key: "tolls", defaults: { de: "Mautgebühren (falls anwendbar)", en: "Toll fees (if applicable)" } },
  { key: "parking", defaults: { de: "Parkgebühren > 30 Min am Abholort", en: "Parking > 30 min at pickup" } },
  { key: "cleaning", defaults: { de: "Reinigungszuschlag bei Verschmutzung", en: "Cleaning surcharge if soiled" } },
  { key: "night", defaults: { de: "Nachtzuschlag 22:00–06:00", en: "Night surcharge 22:00–06:00" } },
];

interface PricingExcludedStripProps {
  t: TFunction;
  locale: Locale;
}

export function PricingExcludedStrip({ t, locale }: PricingExcludedStripProps) {
  const label = pickT(t, "pricing.excluded.label", locale === "de" ? "Separat berechnet" : "Charged separately");
  return (
    <section className="border-b border-line bg-cream">
      <Container className="flex flex-wrap items-center gap-x-9 gap-y-3 py-9">
        <span className="inline-flex shrink-0 items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-danger">
          <span aria-hidden="true" className="block h-px w-5 bg-danger" />
          {label}
        </span>
        <ul className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2">
          {EXCLUDED_ITEMS.map((item, idx) => (
            <li key={item.key} className="relative text-[13.5px] text-mute">
              {idx > 0 && (
                <span aria-hidden="true" className="absolute -left-4 top-1/2 -translate-y-1/2 text-line">
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

// ============================================================================
// 5. COMPARISON — StepNow vs Standard taxi (3-column grid)
// ============================================================================

interface ComparisonRow {
  key: string;
  defaults: {
    de: { label: string; stepnow: string; taxi: string };
    en: { label: string; stepnow: string; taxi: string };
  };
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    key: "row1",
    defaults: {
      de: { label: "Preis Esslingen → STR", stepnow: "Festpreis €70 — bei Buchung bestätigt", taxi: "Taxameter ca. €80–110, vom Verkehr abhängig" },
      en: { label: "Price for Esslingen → STR", stepnow: "Fixed €70 — confirmed at booking", taxi: "Meter-based ≈ €80–110, depends on traffic" },
    },
  },
  {
    key: "row2",
    defaults: {
      de: { label: "Fahrer zugewiesen", stepnow: "Gleiche Nummer, gleicher Fahrer, jedes Mal", taxi: "Wen auch immer die Zentrale schickt" },
      en: { label: "Driver assigned", stepnow: "Same number, same driver, every time", taxi: "Whoever dispatch sends" },
    },
  },
  {
    key: "row3",
    defaults: {
      de: { label: "Im Voraus gebucht", stepnow: "Online oder telefonisch vorbestellt", taxi: "Am Tag selbst herangerufen, Verfügbarkeit unklar" },
      en: { label: "Booked in advance", stepnow: "Pre-booked online or by phone", taxi: "Hailed on the day, hope for availability" },
    },
  },
  {
    key: "row4",
    defaults: {
      de: { label: "Meet & Greet am Flughafen", stepnow: "Bei Flughafenstrecken inklusive", taxi: "Zusatzservice falls verfügbar" },
      en: { label: "Meet & greet at airport", stepnow: "Included with airport routes", taxi: "Extra service if available" },
    },
  },
  {
    key: "row5",
    defaults: {
      de: { label: "Rechnung für Geschäftskunden", stepnow: "Detaillierte Rechnung nach Vereinbarung", taxi: "Handgeschriebene oder gedruckte Quittung" },
      en: { label: "Receipt for business", stepnow: "Detailed invoice, by arrangement", taxi: "Handwritten or printed slip" },
    },
  },
];

interface PricingComparisonProps {
  t: TFunction;
  locale: Locale;
}

export function PricingComparison({ t, locale }: PricingComparisonProps) {
  const headLabel = pickT(t, "pricing.comparison.head_label", locale === "de" ? "Erlebnis" : "Experience");
  const headTaxi = pickT(t, "pricing.comparison.head_taxi", locale === "de" ? "Normales Taxi" : "Standard taxi");

  return (
    <section className="bg-cream">
      <Container className="py-14 md:py-16">
        <div className="mb-8 text-center md:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
            {pickT(t, "pricing.comparison.eyebrow", locale === "de" ? "Gleiche Fahrt — anderes Erlebnis" : "Same ride — different experience")}
          </p>
          <h2 className="mt-2 font-serif text-[32px] leading-tight tracking-tight md:text-[38px]">
            {pickT(t, "pricing.comparison.heading", locale === "de" ? "StepNow vs. ein normales Taxi" : "StepNow vs. a standard taxi")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-mute">
            {pickT(
              t,
              "pricing.comparison.lead",
              locale === "de" ? "Der Unterschied liegt in dem, was Sie vor der Fahrt wissen." : "The difference is in what you know before the ride starts.",
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 border border-line bg-paper md:grid-cols-3">
          {/* Header row */}
          <div className="border-b border-line bg-paper px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute-soft md:px-6">
            {headLabel}
          </div>
          <div className="border-b border-cream/10 bg-ink px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gold md:px-6">
            StepNow
          </div>
          <div className="border-b border-line bg-paper px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute-soft md:px-6">
            {headTaxi}
          </div>
          {/* Data rows */}
          {COMPARISON_ROWS.map((row, idx) => {
            const isLast = idx === COMPARISON_ROWS.length - 1;
            const label = pickT(t, `pricing.comparison.${row.key}.label`, row.defaults[locale].label);
            const stepnowText = pickT(t, `pricing.comparison.${row.key}.stepnow`, row.defaults[locale].stepnow);
            const taxiText = pickT(t, `pricing.comparison.${row.key}.taxi`, row.defaults[locale].taxi);
            return (
              <div key={row.key} className="contents">
                <div className={`bg-paper px-5 py-4 text-[13.5px] text-ink md:px-6 ${isLast ? "" : "border-b border-line"}`}>
                  {label}
                </div>
                <div className={`bg-ink px-5 py-4 text-[13.5px] text-cream md:px-6 ${isLast ? "" : "border-b border-cream/10"}`}>
                  <span className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={2.5} aria-hidden="true" />
                    <span>{stepnowText}</span>
                  </span>
                </div>
                <div className={`bg-paper px-5 py-4 text-[13.5px] text-mute md:px-6 ${isLast ? "" : "border-b border-line"}`}>
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

// ============================================================================
// 6. PAYMENT + CANCELLATION — pills + 3-step ladder
// ============================================================================

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

export function PricingPaymentCancellation({ t, locale, agbHref }: PricingPaymentCancellationProps) {
  return (
    <section className="border-t border-line bg-paper">
      <Container className="grid items-start gap-7 py-10 md:grid-cols-[5fr_7fr] md:gap-14">
        {/* Payment row */}
        <div className="flex flex-col items-start gap-3 md:flex-row md:gap-6">
          <div className="md:min-w-[140px] md:shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
              {pickT(t, "pricing.payment.eyebrow", locale === "de" ? "Bezahlung" : "Payment")}
            </p>
            <h3 className="mt-1 font-serif text-[19px] font-medium leading-tight tracking-tight">
              {pickT(t, "pricing.payment.heading", locale === "de" ? "So zahlen Sie" : "How to pay")}
            </h3>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {PAYMENT_METHODS.map(({ Icon, key, defaults }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 border border-line bg-cream px-3 py-1.5 text-[12.5px] font-medium text-ink"
              >
                <Icon className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
                {pickT(t, `pricing.payment.${key}`, defaults[locale])}
              </span>
            ))}
          </div>
        </div>
        {/* Cancellation row */}
        <div className="flex flex-col items-start gap-3 md:flex-row md:gap-6">
          <div className="md:min-w-[140px] md:shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
              {pickT(t, "pricing.cancellation.eyebrow", locale === "de" ? "Stornierung" : "Cancellation")}
            </p>
            <h3 className="mt-1 font-serif text-[19px] font-medium leading-tight tracking-tight">
              {pickT(t, "pricing.cancellation.heading", locale === "de" ? "Flexible Bedingungen" : "Flexible policy")}
            </h3>
          </div>
          <div className="flex-1 text-[13px] leading-relaxed text-mute">
            <div className="mb-2.5 flex flex-wrap gap-x-7 gap-y-3">
              <CancelStep
                whenText={pickT(t, "pricing.cancellation.step1.when", locale === "de" ? "≥ 12 Std. VORHER" : "≥ 12 H BEFORE")}
                costText={pickT(t, "pricing.cancellation.step1.cost", locale === "de" ? "Kostenfrei" : "Free")}
                costClass="text-success"
              />
              <CancelStep
                whenText={pickT(t, "pricing.cancellation.step2.when", locale === "de" ? "< 12 Std. VORHER" : "< 12 H BEFORE")}
                costText={pickT(t, "pricing.cancellation.step2.cost", locale === "de" ? "50% des Fahrpreises" : "50% of fare")}
              />
              <CancelStep
                whenText={pickT(t, "pricing.cancellation.step3.when", locale === "de" ? "NICHT ERSCHIENEN" : "NO-SHOW")}
                costText={pickT(t, "pricing.cancellation.step3.cost", locale === "de" ? "Voller Fahrpreis" : "Full fare")}
              />
            </div>
            <Link
              href={agbHref}
              className="inline-block border-b border-gold/40 pb-0.5 text-[11.5px] font-medium text-gold-deep transition-colors hover:border-ink hover:text-ink"
            >
              {pickT(t, "pricing.cancellation.full_terms", locale === "de" ? "Vollständige AGB ansehen →" : "See full terms (AGB) →")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CancelStep({
  whenText,
  costText,
  costClass = "text-ink",
}: {
  whenText: string;
  costText: string;
  costClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mute-soft">{whenText}</span>
      <span className={`font-serif text-[18px] font-medium ${costClass}`}>{costText}</span>
    </div>
  );
}
