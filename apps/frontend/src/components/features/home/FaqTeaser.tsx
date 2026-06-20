import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { FaqPublic, Locale } from "@/types";
import { Container } from "@/components/shared";
import { buildFaqPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { pickT } from "@/lib/i18n/pick";
import { FaqTeaserAccordion } from "./FaqTeaserAccordion";

interface FaqTeaserProps {
  t: TFunction;
  faqs: FaqPublic[];
  locale: Locale;
}

export function FaqTeaser({ t, faqs, locale }: FaqTeaserProps) {
  const items = faqs.filter((f) => f.category === "general").slice(0, 3);
  if (items.length === 0) return null;

  const allFaqHref = locale === "de" ? "/kontakt#faq" : "/en/contact#faq";
  const lead = pickT(
    t,
    "home.faq.lead",
    locale === "de"
      ? "Kurze Antworten auf häufige Fragen rund um Buchung, Preise und Ablauf."
      : "Quick answers to common questions on booking, pricing and how it works.",
  );

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "home.faq.pre_heading", "FAQ")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {t("home.faq.heading")}
            </h2>
            <span className="accent-rule mt-4" aria-hidden="true" />
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {lead}
            </p>
            <Link
              href={allFaqHref}
              className="mt-6 inline-flex items-center gap-2 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)] transition-colors duration-base ease-out-premium hover:border-[color:var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
            >
              {t("home.faq.view_all")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] shadow-premium">
            <FaqTeaserAccordion items={items} />
          </div>
        </div>
      </Container>
      <JsonLd data={buildFaqPageJsonLd(items)} />
    </section>
  );
}
