// src/components/features/pricing/PricingTable.tsx
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic, ServicePublic } from "@/types";
import { Container, EmptyState } from "@/components/shared";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface PricingTableProps {
  t: TFunction;
  service: ServicePublic;
  categories: PricingCategoryPublic[];
  locale: Locale;
  /** Render an inner section divider above this block. Default true. */
  showDivider?: boolean;
}

/**
 * Per-service pricing block. Renders service title + each pricing category as
 * a labeled table. Hides cleanly when no pricing rows exist for the service.
 */
export function PricingTable({
  t,
  service,
  categories,
  locale,
  showDivider = true,
}: PricingTableProps) {
  const hasContent = categories.some((c) => c.items.length > 0);

  return (
    <section
      id={`pricing-${service.slug}`}
      className={cn(showDivider && "border-t border-line", "bg-cream")}
    >
      <Container className="py-section">
        <header className="mb-8 max-w-3xl">
          <h2 className="font-serif text-section">{service.title}</h2>
          <p className="mt-3 text-mute">{service.short_description}</p>
        </header>

        {!hasContent ? (
          <EmptyState
            eyebrow={t("pricing.empty.heading")}
            title={t("pricing.empty.body")}
            description={t("pricing.empty.cta_note")}
          />
        ) : (
          <div className="flex flex-col gap-10">
            {categories
              .filter((c) => c.items.length > 0)
              .map((category) => (
                <div key={category.id}>
                  <header className="mb-4">
                    <h3 className="font-serif text-xl tracking-tight">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-mute">{category.description}</p>
                    )}
                  </header>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line">
                        <th
                          scope="col"
                          className="label-eyebrow !text-mute py-2 pr-4 font-normal"
                        >
                          {locale === "de" ? "Von" : "From"}
                        </th>
                        <th
                          scope="col"
                          className="label-eyebrow !text-mute py-2 pr-4 font-normal"
                        >
                          {locale === "de" ? "Nach" : "To"}
                        </th>
                        <th
                          scope="col"
                          className="label-eyebrow !text-mute py-2 text-right font-normal"
                        >
                          {locale === "de" ? "Preis" : "Price"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {category.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 pr-4 text-[15px] text-ink">{item.from_location}</td>
                          <td className="py-3 pr-4 text-[15px] text-ink">{item.to_location}</td>
                          <td className="py-3 text-right font-serif text-lg text-gold-dark">
                            {formatPrice(item.price_eur, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </Container>
    </section>
  );
}
