// src/components/features/about/ValuesSection.tsx
import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";

interface ValuesSectionProps {
  t: TFunction;
}

const VALUES = [
  { key: "reliability" },
  { key: "safety" },
  { key: "transparency" },
  { key: "personal" },
];

export function ValuesSection({ t }: ValuesSectionProps) {
  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <h2 className="font-serif text-section">{t("about.values.heading")}</h2>
        </header>
        <ul className="grid gap-8 md:grid-cols-2">
          {VALUES.map((v) => (
            <li key={v.key} className="flex flex-col gap-2 border-l-2 border-gold pl-5">
              <h3 className="font-serif text-xl tracking-tight">{t(`about.values.${v.key}.title`)}</h3>
              <p className="text-mute">{t(`about.values.${v.key}.body`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
