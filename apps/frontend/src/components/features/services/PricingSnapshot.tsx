// apps/frontend/src/components/features/services/PricingSnapshot.tsx
// Phase 3d polish — refined hairline rhythm, tabular-nums prices, gold
// price color when present, and a clearer empty-state with "Festpreis-
// Angebot auf Anfrage" copy (per audit §13.2).

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { formatPrice } from "@/utils/formatters";

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
      <section className="border-t border-line bg-paper">
        <Container className="py-section">
          <header className="mb-8 max-w-3xl">
            <p className="label-eyebrow">{t("pricing.page.eyebrow") || "Preise"}</p>
            <h2 className="mt-3 font-serif text-section">{t("pricing.empty.heading")}</h2>
            <p className="mt-4 text-body-lg text-mute">{t("pricing.empty.body")}</p>
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
    <section className="border-t border-line bg-paper">
      <Container className="py-section">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-eyebrow">{t("pricing.page.eyebrow") || "Preise"}</p>
            <h2 className="mt-3 font-serif text-section">{t("pricing.page.title")}</h2>
          </div>
          <Link
            href={pricingHref}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base hover:text-ink"
          >
            {locale === "de" ? "Alle Preise" : "View full pricing"}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>
        <p className="mb-10 max-w-prose text-mute">{t("pricing.page.intro")}</p>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-5"
            >
              <span className="text-[15px] tracking-tight text-ink">
                {item.from_location}{" "}
                <span className="text-mute" aria-hidden="true">
                  →
                </span>{" "}
                {item.to_location}
              </span>
              <span className="font-serif text-xl tabular-nums text-gold-deep">
                {formatPrice(item.price_eur, locale)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12.5px] text-mute">
          {t("pricing.disclaimer") ||
            "Alle Preise inkl. MwSt. Festpreis-Garantie ab Buchungsbestätigung."}
        </p>
      </Container>
    </section>
  );
}
