// src/types/pricing.ts

export interface PricingItemPublic {
  id: string;
  from_location: string;
  to_location: string;
  price_eur: string;
  note: string | null;
  sort_order: number;
}

export interface PricingCategoryPublic {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  items: PricingItemPublic[];
}

export interface PricingItemAdmin {
  id: string;
  category_id: string;
  from_location_de: string;
  from_location_en: string;
  to_location_de: string;
  to_location_en: string;
  price_eur: string;
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
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  items: PricingItemAdmin[];
}
