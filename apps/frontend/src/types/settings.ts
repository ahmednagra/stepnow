// apps/frontend/src/types/settings.ts
// TypeScript types for the public and admin site-settings API responses.
export interface SettingsPublic {
  business_name: string;
  owner_name: string;
  legal_form: string | null;
  address_street: string;
  address_postcode: string;
  address_city: string;
  address_country: string;
  address_lat: string | null;
  address_lng: string | null;
  phone: string;
  phone_mobile: string | null;
  email: string;
  whatsapp_url: string | null;
  tax_number: string | null;
  vat_id: string | null;
  concession_number: string | null;
  concession_authority: string | null;
  concession_date: string | null;
  opening_hours: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  default_meta_title: string;
  default_og_image_url: string | null;
}

export interface SettingsAdmin extends Omit<SettingsPublic, "opening_hours" | "default_meta_title"> {
  id: number;
  opening_hours_de: string;
  opening_hours_en: string;
  default_meta_title_de: string;
  default_meta_title_en: string;
  updated_at: string;
}
