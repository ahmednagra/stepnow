// src/schemas/admin-pricing.schema.ts
import { z } from "zod";
import { normalizeDecimalInput } from "@/utils/decimal";
import { PRICE_UNITS } from "@/types/pricing";

/** ISO 4217 units the panel offers. Add one here and it appears in every price form. */
export const SUPPORTED_CURRENCIES = ["EUR", "CHF", "GBP", "USD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminPricingCategorySchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  name_de: z.string().trim().min(1, "Required").max(200),
  name_en: z.string().trim().min(1, "Required").max(200),
  description_de: optStr(500),
  description_en: optStr(500),
  prices_net: z.boolean(),
});

export type AdminPricingCategoryInput = z.infer<typeof adminPricingCategorySchema>;

export const adminPricingItemSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  from_location_de: optStr(200),
  from_location_en: optStr(200),
  to_location_de: optStr(200),
  to_location_en: optStr(200),
  /** User-typed string; we normalize before sending. Blank = "Preis auf Anfrage". */
  price_eur: z
    .string()
    .trim()
    .refine((v) => !v || normalizeDecimalInput(v) !== null, "Enter a valid amount (e.g. 45.50 or 45,50)"),
  /** "" = flat price; "km" / "min" = rate per kilometre / minute. */
  price_unit: z.enum(["", ...PRICE_UNITS]),
  is_from_price: z.boolean(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  /** Optional route distance. Blank means "not recorded", not zero. */
  distance_km: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || normalizeDecimalInput(v) !== null, "Enter a valid distance (e.g. 24.5)"),
  note_de: optStr(500),
  note_en: optStr(500),
});

export type AdminPricingItemInput = z.infer<typeof adminPricingItemSchema>;
