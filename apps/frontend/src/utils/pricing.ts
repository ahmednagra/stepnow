// src/utils/pricing.ts
// Price-list display rules shared by the pricing page, the services pages and the snapshot:
// one formatter for a price cell and one definition of a service's "ab …" headline price.

import type { TFunction } from "@/lib/i18n/t";
import type { Locale, PricingCategoryPublic, PricingItemPublic } from "@/types";
import { formatPrice } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";

/** "Auf Anfrage" · "ab 40,00 €" · "2,30 € / km" · "9,99 €". */
export function formatItemPrice(item: PricingItemPublic, t: TFunction, locale: Locale): string {
  if (item.price_eur === null) {
    return pickT(t, "pricing.price.on_request", locale === "de" ? "Auf Anfrage" : "On request");
  }
  let text = formatPrice(item.price_eur, locale, item.currency);
  if (item.price_unit) {
    const fallback = item.price_unit === "km" ? "/ km" : locale === "de" ? "/ Min." : "/ min";
    text = `${text} ${pickT(t, `pricing.unit.${item.price_unit}`, fallback)}`;
  }
  if (item.is_from_price) {
    text = `${pickT(t, "pricing.price.from", locale === "de" ? "ab" : "from")} ${text}`;
  }
  return text;
}

/** "Köngen → Flughafen Stuttgart" for a route, the bare label otherwise. */
export function itemLabel(item: PricingItemPublic): string {
  if (item.from_location && item.to_location) return `${item.from_location} → ${item.to_location}`;
  return item.from_location ?? item.to_location ?? "";
}

export interface LowestPrice {
  price: string | null;
  currency: string;
  routeLabel: string | null;
  /** The quoted figure is net (courier) — callers must say so next to it. */
  isNet: boolean;
}

/**
 * A service's headline "ab …" price — the cheapest price a customer can actually book:
 *  · explicit starting prices (is_from_price, e.g. the courier Grundpreis) win when present;
 *  · otherwise the cheapest flat, priced item outside tariff categories. A category that holds
 *    per-km / per-minute rates is a tariff whose flat rows (Anfahrt) are components, not trips.
 * Items priced "auf Anfrage" never count. No candidate → price null ("Auf Anfrage").
 */
export function findLowestPrice(categories: PricingCategoryPublic[]): LowestPrice {
  type Candidate = { num: number; item: PricingItemPublic; category: PricingCategoryPublic };
  const starting: Candidate[] = [];
  const flat: Candidate[] = [];
  for (const category of categories) {
    const isTariff = category.items.some((i) => i.price_unit !== null);
    for (const item of category.items) {
      if (item.price_eur === null || item.price_unit !== null) continue;
      const num = Number(item.price_eur);
      if (Number.isNaN(num)) continue;
      if (item.is_from_price) starting.push({ num, item, category });
      else if (!isTariff) flat.push({ num, item, category });
    }
  }
  const pool = starting.length > 0 ? starting : flat;
  if (pool.length === 0) return { price: null, currency: "EUR", routeLabel: null, isNet: false };
  const best = pool.reduce((a, b) => (b.num < a.num ? b : a));
  const route = best.item.to_location ? itemLabel(best.item) : best.category.name;
  return {
    price: best.item.price_eur,
    currency: best.item.currency,
    routeLabel: route || null,
    isNet: best.category.prices_net,
  };
}
