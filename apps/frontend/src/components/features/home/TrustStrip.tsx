// apps/frontend/src/components/features/home/TrustStrip.tsx
// Four-icon credentials strip beneath the hero — light surface, hairline rule.
// Trust-by-numbers row (years / rides / fleet / Google rating) renders below it
// when those site_settings fields are populated.

import { Award, BadgeEuro, ShieldCheck, Clock3, Star } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface TrustStripProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

const ITEMS = [
  { key: "home.trust.licensed", Icon: Award },
  { key: "home.trust.fixed_price", Icon: BadgeEuro },
  { key: "home.trust.drivers", Icon: ShieldCheck },
  { key: "home.trust.always_available", Icon: Clock3 },
];

interface Stat {
  value: string;
  label: string;
  star?: boolean;
}

function buildStats(t: TFunction, settings: SettingsPublic, locale: Locale): Stat[] {
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB");
  const de = locale === "de";
  const stats: Stat[] = [];
  if (settings.years_active != null)
    stats.push({ value: `${settings.years_active}`, label: pickT(t, "home.trust.years", de ? "Jahre Erfahrung" : "Years of service") });
  if (settings.rides_completed != null)
    stats.push({ value: `${nf.format(settings.rides_completed)}+`, label: pickT(t, "home.trust.rides", de ? "Fahrten" : "Rides completed") });
  if (settings.fleet_size != null)
    stats.push({ value: `${settings.fleet_size}`, label: pickT(t, "home.trust.fleet", de ? "Fahrzeuge" : "Vehicles") });
  if (settings.google_rating != null)
    stats.push({
      value: nf.format(Number(settings.google_rating)),
      label:
        settings.google_review_count != null
          ? `${nf.format(settings.google_review_count)} ${pickT(t, "home.trust.reviews", de ? "Bewertungen" : "reviews")}`
          : "Google",
      star: true,
    });
  return stats;
}

export function TrustStrip({ t, settings, locale }: TrustStripProps) {
  const stats = buildStats(t, settings, locale);
  return (
    <section
      aria-label={t("home.trust.licensed")}
      className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]"
    >
      <Container className="grid grid-cols-2 gap-x-6 gap-y-4 py-3 md:grid-cols-4 md:gap-x-10 md:py-4">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]"
            >
              <Icon strokeWidth={1.25} className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[13.5px] leading-snug text-[var(--color-text-primary)] md:text-[14px]">
              {t(key)}
            </span>
          </div>
        ))}
      </Container>

      {stats.length > 0 && (
        <div className="border-t border-[color:var(--color-border-soft)]">
          <Container className="grid grid-cols-2 gap-x-6 gap-y-3 py-3 md:grid-cols-4 md:gap-x-10 md:py-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="inline-flex items-center gap-2 font-serif text-[26px] leading-none tracking-tight text-[var(--color-accent-primary)] md:text-[32px]">
                  {s.star && (
                    <Star
                      className="h-4 w-4 fill-[var(--color-accent-secondary)] text-[var(--color-accent-secondary)] md:h-5 md:w-5"
                      aria-hidden="true"
                    />
                  )}
                  {s.value}
                </span>
                <span className="mt-1 text-[12px] leading-snug text-[var(--color-text-secondary)] md:text-[12.5px]">
                  {s.label}
                </span>
              </div>
            ))}
          </Container>
        </div>
      )}
    </section>
  );
}
