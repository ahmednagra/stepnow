// src/schemas/admin-faq.schema.ts
import { z } from "zod";

export const adminFaqSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  active: z.boolean(),
  category: z.string().trim().min(1, "Required").max(50),
  question_de: z.string().trim().min(3, "At least 3 characters").max(500),
  question_en: z.string().trim().min(3, "At least 3 characters").max(500),
  answer_de: z.string().trim().min(3, "At least 3 characters"),
  answer_en: z.string().trim().min(3, "At least 3 characters"),
});

export type AdminFaqInput = z.infer<typeof adminFaqSchema>;
