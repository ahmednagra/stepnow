import Image from "next/image";
import Link from "next/link";
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

const FAQ_IMAGE =
  "/others/faq.avif";

export function FaqTeaser({ t, faqs, locale }: FaqTeaserProps) {
  const items = faqs.filter((f) => f.category === "general").slice(0, 5);
  if (items.length === 0) return null;

  const allFaqHref = locale === "de" ? "/kontakt#faq" : "/en/contact#faq";

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <header className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "home.faq.pre_heading", "FAQ")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {t("home.faq.heading")}
            </h2>
          </div>
          <div className="md:text-right">
            <Link
              href={allFaqHref}
              className="inline-flex text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors duration-base hover:text-[var(--color-text-primary)]"
            >
              {t("home.faq.view_all")} →
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
            <FaqTeaserAccordion items={items} />
          </div>

          <div className="relative min-h-[340px] overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] lg:min-h-full">
            <Image
              src={FAQ_IMAGE}
              alt="Customer support conversation"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.08),rgba(47,58,31,0.48))]" />
          </div>
        </div>
      </Container>
      <JsonLd data={buildFaqPageJsonLd(items)} />
    </section>
  );
}
