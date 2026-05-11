// src/types/service.ts

export interface ServicePublic {
  id: string;
  slug: string;
  slug_de: string;
  slug_en: string;
  title: string;
  short_description: string;
  long_description: string;
  icon: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
}

export interface ServiceAdmin {
  id: string;
  slug_de: string;
  slug_en: string;
  title_de: string;
  title_en: string;
  short_description_de: string;
  short_description_en: string;
  long_description_de: string;
  long_description_en: string;
  icon: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  meta_title_de: string | null;
  meta_title_en: string | null;
  meta_description_de: string | null;
  meta_description_en: string | null;
  sort_order: number;
  active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
