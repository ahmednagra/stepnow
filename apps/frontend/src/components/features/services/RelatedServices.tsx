// src/components/features/services/RelatedServices.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic } from "@/types";
import { Container } from "@/components/shared";

interface RelatedServicesProps {
  t: TFunction;
  current: ServicePublic;
  others: ServicePublic[];
  locale: Locale;
}

export function RelatedServices({ t, current, others, locale }: RelatedServicesProps) {
  const related = others.filter((s) => s.id !== current.id).slice(0, 3);
  if (related.length === 0) return null;

  const detailHrefFor = (s: ServicePublic) =>
    locale === "de" ? `/dienstleistungen/${s.slug}` : `/en/services/${s.slug}`;

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-10 max-w-3xl">
          <h2 className="font-serif text-section">
            {locale === "de" ? "Weitere Dienstleistungen" : "Other services"}
          </h2>
        </header>
        <ul className="grid gap-6 md:grid-cols-3">
          {related.map((s) => (
            <li key={s.id}>
              <Link
                href={detailHrefFor(s)}
                className="group flex h-full flex-col gap-3 border border-line bg-cream p-6 transition-colors duration-base hover:border-ink"
              >
                <h3 className="font-serif text-xl tracking-tight">{s.title}</h3>
                <p className="text-mute">{s.short_description}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-gold-dark group-hover:text-ink">
                  {t("services.card.learn_more")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
