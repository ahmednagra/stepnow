// apps/frontend/src/components/features/home/FaqTeaser.tsx
// Native-details accordion with gold chevron — top-5 general FAQs.

import Link from "next/link";
import { Plus } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { FaqPublic, Locale } from "@/types";
import { Container, Markdown } from "@/components/shared";
import { buildFaqPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { pickT } from "@/lib/i18n/pick";

interface FaqTeaserProps {
  t: TFunction;
  faqs: FaqPublic[];
  locale: Locale;
}

export function FaqTeaser({ t, faqs, locale }: FaqTeaserProps) {
  if (faqs.length === 0) return null;
  const items = faqs.filter((f) => f.category === "general").slice(0, 5);
  if (items.length === 0) return null;

  const allFaqHref = locale === "de" ? "/kontakt#faq" : "/en/contact#faq";

  return (
    <section className="bg-paper">
      <Container className="py-section">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-eyebrow">{pickT(t, "home.faq.pre_heading", "FAQ")}</p>
            <h2 className="mt-2 font-serif text-section">{t("home.faq.heading")}</h2>
          </div>
          <Link
            href={allFaqHref}
            className="text-[13px] font-medium uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base hover:text-ink"
          >
            {t("home.faq.view_all")} →
          </Link>
        </header>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((faq) => (
            <li key={faq.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-ink">
                  <span className="text-[16px] font-semibold leading-snug tracking-tight md:text-[17px]">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-line text-mute transition-all duration-base ease-out-premium group-open:rotate-45 group-open:border-gold group-open:text-gold-deep"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                </summary>
                <div className="prose-faq pb-5 pr-12 text-mute">
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
