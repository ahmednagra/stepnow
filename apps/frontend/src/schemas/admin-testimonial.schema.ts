// src/schemas/admin-testimonial.schema.ts
import { z } from "zod";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminTestimonialSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  active: z.boolean(),
  source: z.string().trim().min(1, "Required").max(50),
  author_name: z.string().trim().min(1, "Required").max(200),
  author_role_de: optStr(200),
  author_role_en: optStr(200),
  quote_de: z.string().trim().min(5, "At least 5 characters"),
  quote_en: z.string().trim().min(5, "At least 5 characters"),
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  date_given: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Must be YYYY-MM-DD"),
});

export type AdminTestimonialInput = z.infer<typeof adminTestimonialSchema>;
