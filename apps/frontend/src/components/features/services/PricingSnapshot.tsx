// src/components/features/services/PricingSnapshot.tsx
import Link from "next/link";
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

/**
 * Shows a condensed price preview (up to 4 items across the top categories)
 * with a link to the full pricing page. If no pricing is configured for this
 * service, shows the "request a quote" empty state.
 */
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
      <section className="border-t border-line bg-cream">
        <Container className="py-section">
          <header className="mb-6 max-w-3xl">
            <h2 className="font-serif text-section">{t("pricing.page.title")}</h2>
            <p className="mt-3 text-body-lg text-mute">{t("pricing.empty.heading")}</p>
          </header>
          <Link href={bookingHref}>
            <Button size="lg">{t("pricing.empty.cta")}</Button>
          </Link>
        </Container>
      </section>
    );
  }

  // Show up to 6 highlighted items
  const items = allItems.slice(0, 6);

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-serif text-section">{t("pricing.page.title")}</h2>
          <Link
            href={pricingHref}
            className="text-sm font-medium text-gold-dark transition-colors duration-base hover:text-ink"
          >
            {locale === "de" ? "Alle Preise ansehen" : "View full pricing"} →
          </Link>
        </header>
        <p className="mb-8 max-w-prose text-mute">{t("pricing.page.intro")}</p>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-4 py-4">
              <span className="text-[15px] text-ink">
                {item.from_location} → {item.to_location}
              </span>
              <span className="font-serif text-lg text-gold-dark">
                {formatPrice(item.price_eur, locale)}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
