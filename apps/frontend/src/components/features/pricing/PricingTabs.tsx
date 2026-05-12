// apps/frontend/src/components/features/pricing/PricingTabs.tsx
// Client component — owns tab state, syncs with URL hash for deep links.
// All other pricing sections (Featured hero, Trust strip, etc.) are server
// components and live in PricingSections.tsx alongside the fallback image
// helper imported below.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Plane, HeartPulse, GraduationCap, Users, type LucideIcon } from "lucide-react";
import type { Locale, PricingCategoryPublic, ServicePublic, UiStringsMap } from "@/types";
import { createT } from "@/lib/i18n/t";
import { formatPrice } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";
import { getServiceHeroImage } from "./PricingSections";

export interface ServicePricing {
  service: ServicePublic;
  categories: PricingCategoryPublic[];
}

interface PricingTabsProps {
  /** Plain object — functions can't cross the server→client boundary. */
  strings: UiStringsMap;
  locale: Locale;
  data: ServicePricing[];
}

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  flughafentransfer: Plane,
  "airport-transfer": Plane,
  krankenhausfahrten: HeartPulse,
  "hospital-transport": HeartPulse,
  schuelerbefoerderung: GraduationCap,
  "school-transport": GraduationCap,
  "shuttle-service": Users,
};

function countItems(categories: PricingCategoryPublic[]): number {
  return categories.reduce((sum, c) => sum + c.items.length, 0);
}

export function PricingTabs({ strings, locale, data }: PricingTabsProps) {
  // Rebuild t() on the client from the serializable strings map.
  // Memoized so it's stable across re-renders.
  const t = useMemo(() => createT(strings, locale), [strings, locale]);

  const [activeSlug, setActiveSlug] = useState<string>(data[0]?.service.slug ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && data.some((d) => d.service.slug === hash)) {
        setActiveSlug(hash);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [data]);

  const handleTabClick = (slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = slug;
      window.history.replaceState(null, "", url.toString());
    }
  };

  if (data.length === 0) return null;

  return (
    <div>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label={pickT(t, "pricing.tabs.aria_label", "Service pricing")}
        className="flex gap-0 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {data.map(({ service, categories }) => {
          const Icon = ICON_BY_SLUG[service.slug] ?? Plane;
          const isActive = activeSlug === service.slug;
          const count = countItems(categories);
          return (
            <button
              key={service.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => handleTabClick(service.slug)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 text-[13px] font-medium transition-colors duration-base -mb-px",
                isActive
                  ? "border-gold text-ink font-semibold"
                  : "border-transparent text-mute hover:text-ink",
              )}
            >
              <Icon
                className={cn("h-3.5 w-3.5", isActive ? "text-gold-deep" : "text-mute-soft")}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span>{service.title}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 inline-block min-w-[24px] rounded-full border px-1.5 py-0.5 text-center text-[10.5px] tabular-nums",
                    isActive
                      ? "border-gold/30 text-gold-deep"
                      : "border-line text-mute-soft",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab panel */}
      {data.map(({ service, categories }) => {
        const isActive = activeSlug === service.slug;
        const heroUrl = getServiceHeroImage(service.slug, service.hero_image_url);
        return (
          <div
            key={service.id}
            role="tabpanel"
            id={`pricing-panel-${service.slug}`}
            hidden={!isActive}
            className={cn(!isActive && "hidden")}
          >
            {/* Photo banner — plain <img> so external fallback URLs work
                without adding them to next.config.mjs remotePatterns. */}
            <div className="relative mt-7 h-[200px] overflow-hidden bg-ink md:h-[240px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt=""
                loading={isActive ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/15" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6 z-10 max-w-xl text-cream md:bottom-6 md:left-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {service.title}
                </p>
                <h3 className="mt-1.5 font-serif text-[26px] leading-tight tracking-tight md:text-[30px]">
                  {pickT(
                    t,
                    `pricing.tab.${service.slug}.tagline`,
                    locale === "de" ? "Pünktlich, vorbestellt, persönlich." : "On time, pre-booked, personal.",
                  )}
                </h3>
                {service.short_description && (
                  <p className="mt-2 text-[13px] text-cream/75">{service.short_description}</p>
                )}
              </div>
            </div>

            {/* Pricing tables */}
            <div className="pt-7">
              {categories.length === 0 || countItems(categories) === 0 ? (
                <EmptyCategory t={t} locale={locale} />
              ) : (
                <>
                  {categories
                    .filter((c) => c.items.length > 0)
                    .map((category) => (
                      <div key={category.id} className="mb-7 last:mb-0">
                        <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-line pb-2">
                          <h4 className="text-[15px] font-semibold tracking-tight text-ink">
                            {category.name}
                          </h4>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute-soft">
                            {category.items.length}
                            {locale === "de" ? " Strecken" : " routes"}
                          </span>
                        </div>
                        {category.description && (
                          <p className="mb-3 text-[13px] text-mute">{category.description}</p>
                        )}
                        <table className="w-full border-collapse text-left">
                          <thead className="hidden md:table-header-group">
                            <tr>
                              <th scope="col" className="py-2.5 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute-soft" style={{ width: "30%" }}>
                                {locale === "de" ? "Von" : "From"}
                              </th>
                              <th scope="col" className="py-2.5 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute-soft" style={{ width: "50%" }}>
                                {locale === "de" ? "Nach" : "To"}
                              </th>
                              <th scope="col" className="py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mute-soft" style={{ width: "20%" }}>
                                {locale === "de" ? "Preis" : "Price"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.items.map((item) => (
                              <tr key={item.id} className="block border-b border-line-soft transition-colors hover:bg-paper md:table-row">
                                <td className="block py-3 pr-0 align-top text-[14.5px] font-medium text-ink md:table-cell md:pr-4 md:py-3.5">
                                  {item.from_location}
                                </td>
                                <td className="block py-1 pr-0 align-top text-[14.5px] text-ink md:table-cell md:pr-4 md:py-3.5">
                                  {item.to_location}
                                  {item.note && <span className="mt-1 block text-[12px] leading-relaxed text-mute">{item.note}</span>}
                                </td>
                                <td className="block py-1 text-left align-top font-serif text-[20px] font-medium tabular-nums text-gold-deep md:table-cell md:py-3.5 md:text-right md:text-[22px]">
                                  {formatPrice(item.price_eur, locale)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  <div className="mt-6 border-l-2 border-gold bg-paper px-4 py-3 text-[12.5px] leading-relaxed text-mute">
                    {pickT(
                      t,
                      "pricing.footnote",
                      locale === "de"
                        ? "Preise gelten für Einzelfahrten mit bis zu 4 Fahrgästen. Größere Gruppen, Rückfahrten und Nachtzuschläge (22:00–06:00) auf Anfrage. Andere Strecken — Festpreis-Angebot innerhalb von 30 Minuten während der Telefonzeiten."
                        : "Prices valid for one-way bookings with up to 4 passengers. Larger groups, return trips, and night surcharges (22:00–06:00) on request. Other routes — fixed-price quote within 30 minutes during phone hours.",
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyCategory({
  t,
  locale,
}: {
  t: ReturnType<typeof createT>;
  locale: Locale;
}) {
  return (
    <div className="border border-dashed border-line bg-paper p-8 text-center">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
        {pickT(t, "pricing.empty.heading", locale === "de" ? "Festpreis-Angebot" : "Custom quote")}
      </p>
      <p className="mt-3 font-serif text-[22px] leading-tight tracking-tight text-ink">
        {pickT(
          t,
          "pricing.empty.body",
          locale === "de" ? "Auf Anfrage — Antwort innerhalb von 30 Minuten." : "On request — reply within 30 minutes.",
        )}
      </p>
    </div>
  );
}
