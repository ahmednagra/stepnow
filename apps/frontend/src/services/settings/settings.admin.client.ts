// src/services/settings/settings.admin.client.ts
// Admin client calls. Used by the admin UI components via the BFF passthroughs.

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { SettingsAdmin } from "@/types";

export interface SettingsUpdate {
  business_name?: string;
  owner_name?: string;
  legal_form?: string | null;
  address_street?: string;
  address_postcode?: string;
  address_city?: string;
  address_country?: string;
  phone?: string;
  phone_mobile?: string | null;
  email?: string;
  whatsapp_url?: string | null;
  tax_number?: string | null;
  vat_id?: string | null;
  concession_number?: string | null;
  concession_authority?: string | null;
  concession_date?: string | null;     // YYYY-MM-DD
  opening_hours_de?: string;
  opening_hours_en?: string;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_tiktok?: string | null;
  default_meta_title_de?: string;
  default_meta_title_en?: string;
  default_og_image_url?: string | null;
}

export async function fetchAdminSettings(): Promise<SettingsAdmin> {
  return nextjsApiClient.get<SettingsAdmin>("/admin/settings");
}

export async function updateAdminSettings(payload: SettingsUpdate): Promise<SettingsAdmin> {
  return nextjsApiClient.patch<SettingsAdmin>("/admin/settings", payload);
}
