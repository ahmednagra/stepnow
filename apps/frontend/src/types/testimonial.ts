// src/types/testimonial.ts

export interface TestimonialPublic {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  rating: number | null;
  date_given: string | null;
  sort_order: number;
}

export interface TestimonialAdmin {
  id: string;
  source: string;
  author_name: string;
  author_role_de: string | null;
  author_role_en: string | null;
  quote_de: string;
  quote_en: string;
  rating: number | null;
  date_given: string | null;
  sort_order: number;
  active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
