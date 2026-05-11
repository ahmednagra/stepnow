// src/schemas/admin-pricing.schema.ts
import { z } from "zod";
import { normalizeDecimalInput } from "@/utils/decimal";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminPricingCategorySchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  name_de: z.string().trim().min(1, "Required").max(200),
  name_en: z.string().trim().min(1, "Required").max(200),
  description_de: optStr(500),
  description_en: optStr(500),
});

export type AdminPricingCategoryInput = z.infer<typeof adminPricingCategorySchema>;

export const adminPricingItemSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  from_location_de: optStr(200),
  from_location_en: optStr(200),
  to_location_de: optStr(200),
  to_location_en: optStr(200),
  /** User-typed string; we normalize before sending. */
  price_eur: z
    .string()
    .trim()
    .min(1, "Required")
    .refine((v) => normalizeDecimalInput(v) !== null, "Enter a valid amount (e.g. 45.50 or 45,50)"),
  note_de: optStr(500),
  note_en: optStr(500),
});

export type AdminPricingItemInput = z.infer<typeof adminPricingItemSchema>;
