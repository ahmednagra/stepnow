// src/components/features/home/FaqTeaser.tsx
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { FaqPublic, Locale } from "@/types";
import { Container, Markdown } from "@/components/shared";
import { buildFaqPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";

interface FaqTeaserProps {
  t: TFunction;
  faqs: FaqPublic[];
  locale: Locale;
}

export function FaqTeaser({ t, faqs, locale }: FaqTeaserProps) {
  if (faqs.length === 0) return null;
  // Show up to 5 general FAQs
  const items = faqs.filter((f) => f.category === "general").slice(0, 5);
  if (items.length === 0) return null;

  const allFaqHref = locale === "de" ? "/kontakt#faq" : "/en/contact#faq";

  return (
    <section className="bg-cream">
      <Container className="py-section">
        <header className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-serif text-section">{t("home.faq.heading")}</h2>
          <Link
            href={allFaqHref}
            className="text-sm font-medium text-gold-dark transition-colors duration-base hover:text-ink"
          >
            {t("home.faq.view_all")} →
          </Link>
        </header>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((faq) => (
            <li key={faq.id}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left text-ink">
                  <span className="font-serif text-lg leading-snug">{faq.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-mute transition-transform duration-base group-open:rotate-180"
                  />
                </summary>
                <div className="pb-6 pr-9 text-mute">
                  <Markdown source={faq.answer} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Container>
      <JsonLd data={buildFaqPageJsonLd(items)} />
    </section>
  );
}
