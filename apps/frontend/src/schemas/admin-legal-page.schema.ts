// src/schemas/admin-legal-page.schema.ts
import { z } from "zod";

const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const adminLegalPageCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Required")
    .max(50)
    .regex(slugPattern, "Lowercase letters, digits, and hyphens only"),
});

export const adminLegalPageDraftSchema = z.object({
  title_de: z.string().trim().min(1, "Required").max(200),
  title_en: z.string().trim().min(1, "Required").max(200),
  body_de: z.string().trim().min(1, "Required"),
  body_en: z.string().trim().min(1, "Required"),
  changes_summary: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
});

export type AdminLegalPageCreateInput = z.infer<typeof adminLegalPageCreateSchema>;
export type AdminLegalPageDraftInput = z.infer<typeof adminLegalPageDraftSchema>;
