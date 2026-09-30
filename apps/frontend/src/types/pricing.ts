// src/types/pricing.ts

export const PRICE_UNITS = ["km", "min"] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export interface PricingItemPublic {
  id: string;
  from_location: string | null;
  to_location: string | null;
  /** null = "Preis auf Anfrage". */
  price_eur: string | null;
  /** null = flat price; "km" / "min" = rate per kilometre / minute. */
  price_unit: PriceUnit | null;
  /** Starting price, rendered as "ab …". */
  is_from_price: boolean;
  currency: string;
  distance_km: string | null;
  note: string | null;
  sort_order: number;
}

export interface PricingCategoryPublic {
  id: string;
  name: string;
  description: string | null;
  /** True = prices are net, plus statutory VAT (courier); false = Endpreise incl. VAT. */
  prices_net: boolean;
  sort_order: number;
  items: PricingItemPublic[];
}

export interface PricingItemAdmin {
  id: string;
  category_id: string;
  from_location_de: string | null;
  from_location_en: string | null;
  to_location_de: string | null;
  to_location_en: string | null;
  price_eur: string | null;
  price_unit: PriceUnit | null;
  is_from_price: boolean;
  currency: string;
  distance_km: string | null;
  note_de: string | null;
  note_en: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingCategoryAdmin {
  id: string;
  service_id: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  prices_net: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  items: PricingItemAdmin[];
}
