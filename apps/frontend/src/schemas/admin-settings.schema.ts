// src/schemas/admin-settings.schema.ts
// Form schema for the admin settings editor. Server-side schema in
// app/Schemas/admin/settings.py is authoritative — this is for UX only.

import { z } from "zod";

const optionalString = z.string().trim().max(500).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^https?:\/\//i.test(v),
    "Must start with http:// or https://",
  );

export const adminSettingsSchema = z.object({
  business_name: z.string().trim().min(1, "Required").max(200),
  owner_name: z.string().trim().min(1, "Required").max(200),
  legal_form: optionalString,
  address_street: z.string().trim().min(1, "Required").max(200),
  address_postcode: z.string().trim().min(1, "Required").max(10),
  address_city: z.string().trim().min(1, "Required").max(100),
  address_country: z.string().trim().min(1, "Required").max(100),
  phone: z.string().trim().min(1, "Required").max(50),
  phone_mobile: optionalString,
  email: z.string().trim().min(1, "Required").email("Enter a valid email"),
  whatsapp_url: optionalUrl,
  tax_number: optionalString,
  vat_id: optionalString,
  concession_number: optionalString,
  concession_authority: optionalString,
  concession_date: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Must be YYYY-MM-DD",
    ),
  opening_hours_de: z.string().trim().max(1000).optional().or(z.literal("")),
  opening_hours_en: z.string().trim().max(1000).optional().or(z.literal("")),
  social_facebook: optionalUrl,
  social_instagram: optionalUrl,
  social_youtube: optionalUrl,
  social_tiktok: optionalUrl,
  default_meta_title_de: z.string().trim().min(1, "Required").max(200),
  default_meta_title_en: z.string().trim().min(1, "Required").max(200),
  default_og_image_url: optionalUrl,
});

export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>;
