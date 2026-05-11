// apps/frontend/src/components/features/about/ValuesSection.tsx
// Phase 3d polish — values rendered in a 4-column grid (2 on tablet, 4 on
// desktop) with gold serif numerals as visual anchors. Each card has a
// hairline top accent.

import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";

interface ValuesSectionProps {
  t: TFunction;
}

const VALUES = [
  { titleKey: "about.values.reliability.title", bodyKey: "about.values.reliability.body" },
  { titleKey: "about.values.safety.title", bodyKey: "about.values.safety.body" },
  { titleKey: "about.values.transparency.title", bodyKey: "about.values.transparency.body" },
  { titleKey: "about.values.service.title", bodyKey: "about.values.service.body" },
];

export function ValuesSection({ t }: ValuesSectionProps) {
  return (
    <section className="border-t border-line bg-paper">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <p className="label-eyebrow">{t("about.values.eyebrow") || "Unsere Prinzipien"}</p>
          <h2 className="mt-3 font-serif text-section">{t("about.values.heading")}</h2>
        </header>
        <ul className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, idx) => (
            <li key={v.titleKey} className="bg-paper p-8">
              <p
                aria-hidden="true"
                className="font-serif text-3xl tabular-nums text-gold-deep"
              >
                {String(idx + 1).padStart(2, "0")}
              </p>
              <span aria-hidden="true" className="mt-3 block h-px w-10 bg-gold/50" />
              <h3 className="mt-6 font-serif text-xl tracking-tight">{t(v.titleKey)}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-mute">{t(v.bodyKey)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
