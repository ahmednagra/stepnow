// apps/frontend/src/components/features/services/PricingSnapshot.tsx
// Phase 3d polish — refined hairline rhythm, tabular-nums prices, gold
// price color when present, and a clearer empty-state with "Pauschalpreis-
// Angebot auf Anfrage" copy (per audit §13.2).

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { formatPrice } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";

interface PricingSnapshotProps {
  t: TFunction;
  categories: PricingCategoryPublic[];
  pricingHref: string;
  bookingHref: string;
  locale: Locale;
}

export function PricingSnapshot({
  t,
  categories,
  pricingHref,
  bookingHref,
  locale,
}: PricingSnapshotProps) {
  const allItems = categories.flatMap((c) => c.items);

  if (allItems.length === 0) {
    return (
      <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
        <Container className="py-section">
          <header className="mb-8 max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">{pickT(t, "pricing.page.eyebrow", "Preise")}</p>
            <h2 className="mt-3 font-serif text-section text-[var(--color-text-primary)]">{t("pricing.empty.heading")}</h2>
            <p className="mt-4 text-body-lg text-[var(--color-text-secondary)]">{t("pricing.empty.body")}</p>
          </header>
          <Link href={bookingHref}>
            <Button size="lg">{t("pricing.empty.cta")}</Button>
          </Link>
        </Container>
      </section>
    );
  }

  const items = allItems.slice(0, 6);

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
      <Container className="py-section">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">{pickT(t, "pricing.page.eyebrow", "Preise")}</p>
            <h2 className="mt-3 font-serif text-section text-[var(--color-text-primary)]">{t("pricing.page.title")}</h2>
          </div>
          <Link
            href={pricingHref}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors duration-base hover:text-[var(--color-text-primary)]"
          >
            {locale === "de" ? "Alle Preise" : "View full pricing"}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>
        <p className="mb-10 max-w-prose text-[var(--color-text-secondary)]">{t("pricing.page.intro")}</p>
        <ul className="divide-y divide-[color:var(--color-border-soft)] border-y border-[color:var(--color-border-soft)]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-5"
            >
              <span className="text-[15px] tracking-tight text-[var(--color-text-primary)]">
                {item.from_location}{" "}
                <span className="text-[var(--color-text-secondary)]" aria-hidden="true">
                  →
                </span>{" "}
                {item.to_location}
              </span>
              <span className="font-serif text-xl tabular-nums text-[var(--color-accent-primary)]">
                {formatPrice(item.price_eur, locale)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12.5px] text-[var(--color-text-secondary)]">
          {pickT(t, "pricing.disclaimer", "Alle Preise inkl. MwSt. Pauschalpreis-Garantie ab Buchungsbestätigung.")}
        </p>
      </Container>
    </section>
  );
}
