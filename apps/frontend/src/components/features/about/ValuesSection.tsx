// apps/frontend/src/components/features/about/ValuesSection.tsx
// Option A layout — four principle rows with gold numerals on hairline
// dividers. Designed for the narrow (5-col) right side of Row 1, paired
// with the Story column on the left.

import type { TFunction } from "@/lib/i18n/t";
import type { Locale } from "@/types";
import { pickT } from "@/lib/i18n/pick";

interface ValuesSectionProps {
  t: TFunction;
  locale?: Locale;
}

interface ValueEntry {
  titleKey: string;
  bodyKey: string;
  defaults: { de: { title: string; body: string }; en: { title: string; body: string } };
}

const VALUES: ValueEntry[] = [
  {
    titleKey: "about.values.reliability.title",
    bodyKey: "about.values.reliability.body",
    defaults: {
      de: { title: "Verlässlichkeit", body: "Pünktlich, vorbestellt, bestätigt — keine Überraschungen am Abholtag." },
      en: { title: "Reliability", body: "On time, pre-booked, confirmed — no surprises on pickup day." },
    },
  },
  {
    titleKey: "about.values.safety.title",
    bodyKey: "about.values.safety.body",
    defaults: {
      de: { title: "Sicherheit", body: "Geprüfte Fahrer, gewartete Fahrzeuge und volle Haftpflicht." },
      en: { title: "Safety", body: "Vetted drivers, maintained vehicles, and full liability insurance." },
    },
  },
  {
    titleKey: "about.values.transparency.title",
    bodyKey: "about.values.transparency.body",
    defaults: {
      de: { title: "Transparenz", body: "Festpreise vor der Fahrt. Keine versteckten Aufschläge, keine Taxameter-Überraschungen." },
      en: { title: "Transparency", body: "Fixed prices up front. No hidden surcharges, no meter surprises." },
    },
  },
  {
    titleKey: "about.values.service.title",
    bodyKey: "about.values.service.body",
    defaults: {
      de: { title: "Persönlicher Service", body: "Direkter Kontakt zum Inhaber, kein anonymes Callcenter." },
      en: { title: "Personal service", body: "Direct contact with the owner — no anonymous call center." },
    },
  },
];

export function ValuesSection({ t, locale = "de" }: ValuesSectionProps) {
  const eyebrow = pickT(
    t,
    "about.values.eyebrow",
    locale === "de" ? "Unsere Prinzipien" : "Our principles",
  );
  const heading = pickT(
    t,
    "about.values.heading",
    locale === "de" ? "Was uns trägt" : "What we stand for",
  );

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[36px]">
        {heading}
      </h2>
      <ul className="mt-6 grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
        {VALUES.map((v, idx) => {
          const title = pickT(t, v.titleKey, v.defaults[locale].title);
          const body = pickT(t, v.bodyKey, v.defaults[locale].body);
          return (
            <li
              key={v.titleKey}
              className="flex items-start gap-4 bg-[var(--color-bg-page)] p-5"
            >
              <span
                aria-hidden="true"
                className="min-w-[34px] font-serif text-[24px] leading-none tabular-nums text-[color:rgba(85,133,24,0.34)]"
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium tracking-tight text-[var(--color-text-primary)]">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
