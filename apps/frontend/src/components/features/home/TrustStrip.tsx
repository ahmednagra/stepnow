// apps/frontend/src/components/features/home/TrustStrip.tsx
// Four-icon credentials strip beneath the hero — light surface, hairline rule.
// Trust-by-numbers row (years / rides / fleet / Google rating) renders below it
// when those site_settings fields are populated, counting up on scroll-in.

"use client";

import { useEffect, useRef, useState } from "react";
import { Award, BadgeEuro, ShieldCheck, Clock3, Star } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { useUiStrings } from "@/hooks/useUiStrings";
import { pickT } from "@/lib/i18n/pick";

interface TrustStripProps {
  settings: SettingsPublic;
}

const ITEMS = [
  { key: "home.trust.licensed", Icon: Award },
  { key: "home.trust.fixed_price", Icon: BadgeEuro },
  { key: "home.trust.drivers", Icon: ShieldCheck },
  { key: "home.trust.always_available", Icon: Clock3 },
];

interface Stat {
  value: number;
  label: string;
  locale: string;
  suffix?: string;
  decimals?: number;
  star?: boolean;
}

function buildStats(t: TFunction, settings: SettingsPublic, locale: Locale): Stat[] {
  const loc = locale === "de" ? "de-DE" : "en-GB";
  const nf = new Intl.NumberFormat(loc);
  const de = locale === "de";
  const stats: Stat[] = [];
  if (settings.years_active != null)
    stats.push({ value: settings.years_active, locale: loc, label: pickT(t, "home.trust.years", de ? "Jahre Erfahrung" : "Years of service") });
  if (settings.rides_completed != null)
    stats.push({ value: settings.rides_completed, suffix: "+", locale: loc, label: pickT(t, "home.trust.rides", de ? "Fahrten" : "Rides completed") });
  if (settings.fleet_size != null)
    stats.push({ value: settings.fleet_size, locale: loc, label: pickT(t, "home.trust.fleet", de ? "Fahrzeuge" : "Vehicles") });
  if (settings.google_rating != null)
    stats.push({
      value: Number(settings.google_rating),
      decimals: 1,
      star: true,
      locale: loc,
      label:
        settings.google_review_count != null
          ? `${nf.format(settings.google_review_count)} ${pickT(t, "home.trust.reviews", de ? "Bewertungen" : "reviews")}`
          : "Google",
    });
  return stats;
}

export function TrustStrip({ settings }: TrustStripProps) {
  const { t, locale } = useUiStrings();
  const stats = buildStats(t, settings, locale);
  return (
    <section
      aria-label={t("home.trust.licensed")}
      className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]"
    >
      <Container className="grid grid-cols-2 gap-x-6 gap-y-3 py-2.5 md:grid-cols-4 md:gap-x-10 md:py-3">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="group flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] transition-colors duration-base ease-out-premium group-hover:border-[color:var(--color-accent-primary)] group-hover:bg-[color:rgba(168,134,90,0.10)]"
            >
              <Icon strokeWidth={1.25} className="h-4 w-4" />
            </span>
            <span className="text-[12.5px] leading-snug text-[var(--color-text-primary)] md:text-[13.5px]">
              {t(key)}
            </span>
          </div>
        ))}
      </Container>

      {stats.length > 0 && (
        <div className="border-t border-[color:var(--color-border-soft)]">
          <Container as="div" className="py-2.5 md:py-3">
            <StatsRow stats={stats} />
          </Container>
        </div>
      )}
    </section>
  );
}

function StatsRow({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [run, setRun] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (reduce || !el || typeof IntersectionObserver === "undefined") {
      setInstant(true);
      setRun(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRun(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 md:gap-x-10">
      {stats.map((s) => (
        <StatCell key={s.label} stat={s} run={run} instant={instant} />
      ))}
    </div>
  );
}

function StatCell({ stat, run, instant }: { stat: Stat; run: boolean; instant: boolean }) {
  const display = useCountUp(stat.value, run, instant, stat.decimals ?? 0, stat.locale);
  return (
    <div className="flex flex-col">
      <span className="inline-flex items-center gap-1.5 font-serif text-[22px] leading-none tracking-tight text-[var(--color-accent-primary)] md:text-[26px]">
        {stat.star && (
          <Star
            className="h-4 w-4 fill-[var(--color-accent-secondary)] text-[var(--color-accent-secondary)]"
            aria-hidden="true"
          />
        )}
        {display}
        {stat.suffix ?? ""}
      </span>
      <span className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-text-secondary)] md:text-[12px]">
        {stat.label}
      </span>
    </div>
  );
}

function useCountUp(target: number, run: boolean, instant: boolean, decimals: number, locale: string): string {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (instant) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const duration = 1200;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, instant, target]);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}
