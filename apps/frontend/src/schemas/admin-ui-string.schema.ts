// src/schemas/admin-ui-string.schema.ts
import { z } from "zod";

const keyPattern = /^[a-z0-9][a-z0-9_.]*[a-z0-9]$/;
const nsPattern = /^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/;

export const adminUiStringCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(200)
    .regex(keyPattern, "Lowercase letters, digits, dots and underscores"),
  namespace: z
    .string()
    .trim()
    .min(1, "Required")
    .max(100)
    .regex(nsPattern, "Lowercase letters, digits, and underscores"),
  value_de: z.string().trim().min(1, "Required").max(10000),
  value_en: z.string().trim().min(1, "Required").max(10000),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  is_locked: z.boolean().default(false),
});

export const adminUiStringUpdateSchema = z.object({
  namespace: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(nsPattern)
    .optional(),
  value_de: z.string().trim().min(1).max(10000).optional(),
  value_en: z.string().trim().min(1).max(10000).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  is_locked: z.boolean().optional(),
});

export type AdminUiStringCreateInput = z.infer<typeof adminUiStringCreateSchema>;
export type AdminUiStringUpdateInput = z.infer<typeof adminUiStringUpdateSchema>;
