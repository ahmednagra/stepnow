// src/schemas/admin-service.schema.ts
import { z } from "zod";

const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminServiceSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  active: z.boolean(),
  icon: optStr(50),
  slug_de: z
    .string()
    .trim()
    .min(1, "Required")
    .max(100)
    .regex(slugPattern, "Lowercase letters, digits, and hyphens only"),
  slug_en: z
    .string()
    .trim()
    .min(1, "Required")
    .max(100)
    .regex(slugPattern, "Lowercase letters, digits, and hyphens only"),
  title_de: z.string().trim().min(1, "Required").max(200),
  title_en: z.string().trim().min(1, "Required").max(200),
  short_description_de: optStr(500),
  short_description_en: optStr(500),
  long_description_de: z.string().optional().or(z.literal("")),
  long_description_en: z.string().optional().or(z.literal("")),
  hero_image_url: optStr(500),
  og_image_url: optStr(500),
  meta_title_de: optStr(200),
  meta_title_en: optStr(200),
  meta_description_de: optStr(300),
  meta_description_en: optStr(300),
});

export type AdminServiceInput = z.infer<typeof adminServiceSchema>;
