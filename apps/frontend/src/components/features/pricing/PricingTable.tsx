// apps/frontend/src/components/features/pricing/PricingTable.tsx
// Phase 3d polish — addresses audit M-10:
//   • Per-category section uses a serif sub-heading + hairline rule.
//   • Price column is tabular-nums + gold-deep for visual weight.
//   • Always shows the "what's always included" footnote line.

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
  showDivider?: boolean;
}

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
        <header className="mb-10 max-w-3xl">
          <p className="label-eyebrow">{service.title}</p>
          <h2 className="mt-3 font-serif text-section">{service.title}</h2>
          {service.short_description && (
            <p className="mt-4 max-w-prose text-mute">{service.short_description}</p>
          )}
        </header>

        {!hasContent ? (
          <EmptyState
            eyebrow={t("pricing.empty.heading")}
            title={t("pricing.empty.body")}
            description={t("pricing.empty.cta_note")}
          />
        ) : (
          <div className="flex flex-col gap-14">
            {categories
              .filter((c) => c.items.length > 0)
              .map((category) => (
                <div key={category.id}>
                  <header className="mb-6 flex flex-col gap-2">
                    <h3 className="font-serif text-2xl tracking-tight">{category.name}</h3>
                    {category.description && (
                      <p className="text-[14px] text-mute">{category.description}</p>
                    )}
                    <span aria-hidden="true" className="mt-2 block h-px w-12 bg-gold" />
                  </header>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line">
                        <th
                          scope="col"
                          className="py-3 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute"
                        >
                          {locale === "de" ? "Von" : "From"}
                        </th>
                        <th
                          scope="col"
                          className="py-3 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute"
                        >
                          {locale === "de" ? "Nach" : "To"}
                        </th>
                        <th
                          scope="col"
                          className="py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute"
                        >
                          {locale === "de" ? "Preis" : "Price"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item) => (
                        <tr key={item.id} className="border-b border-line-soft">
                          <td className="py-4 pr-4 align-top text-[15px] text-ink">
                            {item.from_location}
                          </td>
                          <td className="py-4 pr-4 align-top text-[15px] text-ink">
                            {item.to_location}
                            {item.note && (
                              <span className="mt-1 block text-[12.5px] text-mute">
                                {item.note}
                              </span>
                            )}
                          </td>
                          <td className="py-4 align-top text-right font-serif text-lg tabular-nums text-gold-deep">
                            {formatPrice(item.price_eur, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            <p className="text-[12.5px] text-mute">
              {t("pricing.footnote") ||
                "Alle Preise inkl. MwSt. Festpreis-Garantie ab Buchungsbestätigung. Andere Strecken auf Anfrage."}
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
