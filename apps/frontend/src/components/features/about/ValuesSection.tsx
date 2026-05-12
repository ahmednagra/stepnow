// apps/frontend/src/components/features/about/ValuesSection.tsx
// Four-tile principles grid with gold numerals and bilingual fallbacks.

import type { TFunction } from "@/lib/i18n/t";
import type { Locale } from "@/types";
import { Container } from "@/components/shared";

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

function isResolved(value: string | null | undefined, key: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === key) return false;
  if (trimmed.startsWith("[")) return false;
  if (!/\s/.test(trimmed) && /^[a-z0-9._-]+$/i.test(trimmed) && trimmed.includes(".")) return false;
  return true;
}

function pick(t: TFunction, key: string, fallback: string): string {
  const raw = t(key);
  return isResolved(raw, key) ? raw : fallback;
}

export function ValuesSection({ t, locale = "de" }: ValuesSectionProps) {
  const eyebrow = pick(t, "about.values.eyebrow", locale === "de" ? "Unsere Prinzipien" : "Our principles");
  const heading = pick(t, "about.values.heading", locale === "de" ? "Was uns trägt" : "What we stand for");

  return (
    <section className="border-t border-line bg-paper">
      <Container className="py-section">
        <header className="mb-4 max-w-3xl">
          <p className="label-eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-serif text-section">{heading}</h2>
        </header>
        <ul className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, idx) => {
            const title = pick(t, v.titleKey, v.defaults[locale].title);
            const body = pick(t, v.bodyKey, v.defaults[locale].body);
            return (
              <li key={v.titleKey} className="bg-paper p-6">
                <p aria-hidden="true" className="font-serif text-3xl tabular-nums text-gold-deep">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <span aria-hidden="true" className="mt-2 block h-px w-10 bg-gold/50" />
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-mute">{body}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
