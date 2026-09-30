// apps/frontend/src/components/features/pricing/PricingPriceList.tsx
// The public price list: every service's categories in service order, mirroring the printed
// flyer/Preisliste section by section. Server-rendered — no tab state, every price is in the HTML
// for crawlers and for visitors comparing against the flyer. An anchor nav replaces the old tabs;
// each service section keeps its slug as id so /preise#<slug> deep links still land.

import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic, ServicePublic } from "@/types";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";
import { getServiceIcon } from "@/utils/service-icons";
import { formatItemPrice, itemLabel } from "@/utils/pricing";

export interface ServicePricing {
  service: ServicePublic;
  categories: PricingCategoryPublic[];
}

interface PricingPriceListProps {
  t: TFunction;
  locale: Locale;
  data: ServicePricing[];
}

export function PricingPriceList({ t, locale, data }: PricingPriceListProps) {
  const sections = data.filter(({ categories }) => categories.some((c) => c.items.length > 0));
  if (sections.length === 0) return <EmptyCategory t={t} locale={locale} />;

  return (
    <div>
      <nav
        aria-label={pickT(t, "pricing.tabs.aria_label", locale === "de" ? "Preise nach Service" : "Pricing by service")}
        className="flex gap-0 overflow-x-auto border-b border-[color:var(--color-border-soft)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map(({ service }) => {
          const Icon = getServiceIcon(service.icon, service.slug);
          return (
            <a
              key={service.id}
              href={`#${service.slug}`}
              className="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-5 py-3.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors duration-base hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
            >
              <Icon className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" strokeWidth={1.5} aria-hidden="true" />
              {service.title}
            </a>
          );
        })}
      </nav>

      {sections.map(({ service, categories }) => {
        const Icon = getServiceIcon(service.icon, service.slug);
        const visible = categories.filter((c) => c.items.length > 0);
        return (
          <section key={service.id} id={service.slug} aria-labelledby={`pricing-${service.slug}`} className="scroll-mt-24 pt-12">
            <header className="mb-6 flex items-start gap-4 border-b border-[color:var(--color-border-soft)] pb-5">
              <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-accent-soft)]">
                <Icon className="h-5 w-5 text-[var(--color-accent-primary)]" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3 id={`pricing-${service.slug}`} className="font-serif text-[28px] leading-tight tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
                  {service.title}
                </h3>
                <p className="mt-1 text-[13.5px] text-[var(--color-text-secondary)]">
                  {pickT(t, `pricing.tab.${service.slug}.tagline`, service.short_description)}
                </p>
              </div>
            </header>
            <div className="grid gap-6 lg:grid-cols-2">
              {visible.map((category) => (
                <CategoryTable key={category.id} t={t} locale={locale} category={category} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-10 border-l-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-accent-soft)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
        {pickT(
          t,
          "pricing.footnote",
          locale === "de"
            ? "Festpreise gelten je einfacher Fahrt — Hin- und Rückfahrt sind zwei Fahrten. Alle Preise gelten für bis zu 4 Personen (Fahrzeugkapazität). Andere Strecken auf Anfrage."
            : "Fixed prices apply per one-way trip — outbound and return are two trips. All prices apply to up to 4 persons (vehicle capacity). Other routes on request.",
        )}
      </p>
    </div>
  );
}

function CategoryTable({ t, locale, category }: { t: TFunction; locale: Locale; category: PricingCategoryPublic }) {
  const priceHeading = pickT(t, "pricing.table.price", locale === "de" ? "Preis" : "Price");
  const netLabel = pickT(t, "pricing.price.net", locale === "de" ? "netto" : "net");
  return (
    <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5 md:p-6">
      <h4 className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">{category.name}</h4>
      {category.description && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">{category.description}</p>
      )}
      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[color:var(--color-border-soft)]">
            <th scope="col" className="pb-2 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {pickT(t, "pricing.table.item", locale === "de" ? "Leistung / Strecke" : "Service / route")}
            </th>
            <th scope="col" className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {category.prices_net ? `${priceHeading} (${netLabel})` : priceHeading}
            </th>
          </tr>
        </thead>
        <tbody>
          {category.items.map((item) => {
            const onRequest = item.price_eur === null;
            return (
              <tr key={item.id} className="border-b border-[color:var(--color-border-soft)] last:border-b-0">
                <td className="py-3 pr-4 align-top text-[14px] text-[var(--color-text-primary)]">
                  {itemLabel(item)}
                  {item.note && (
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-text-secondary)]">{item.note}</span>
                  )}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap py-3 text-right align-top tabular-nums",
                    onRequest
                      ? "text-[13px] font-medium text-[var(--color-text-secondary)]"
                      : "font-serif text-[19px] font-medium text-[var(--color-accent-primary)]",
                  )}
                >
                  {formatItemPrice(item, t, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyCategory({ t, locale }: { t: TFunction; locale: Locale }) {
  return (
    <div className="border border-dashed border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-8 text-center">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
        {pickT(t, "pricing.empty.heading", locale === "de" ? "Preis auf Anfrage" : "Price on request")}
      </p>
      <p className="mt-3 font-serif text-[22px] leading-tight tracking-tight text-[var(--color-text-primary)]">
        {pickT(
          t,
          "pricing.empty.body",
          locale === "de"
            ? "Für diese Leistung erstellen wir Ihnen gern ein individuelles Angebot."
            : "We are happy to prepare an individual quote for this service.",
        )}
      </p>
    </div>
  );
}
