// src/schemas/contact.schema.ts
import { z } from "zod";
import { CONTACT_CATEGORIES } from "@/types";

/**
 * Contact form schema. Error messages are i18n keys, resolved at render time
 * by the t() helper. Snake_case throughout to match backend Pydantic.
 *
 * The honeypot `website` field must be empty — bots fill it, humans don't.
 */
export const contactSchema = z.object({
  name: z
    .string({ required_error: "errors.required" })
    .trim()
    .min(2, "errors.contact.name_min")
    .max(120, "errors.contact.name_max"),
  email: z
    .string({ required_error: "errors.required" })
    .trim()
    .email("errors.contact.email_invalid"),
  phone: z
    .string()
    .trim()
    .max(40, "errors.contact.phone_max")
    .optional()
    .or(z.literal("")),
  subject_category: z.enum(CONTACT_CATEGORIES, {
    errorMap: () => ({ message: "errors.contact.category_required" }),
  }),
  message: z
    .string({ required_error: "errors.required" })
    .trim()
    .min(10, "errors.contact.message_min")
    .max(5000, "errors.contact.message_max"),
  consent_dsgvo: z.literal(true, {
    errorMap: () => ({ message: "errors.consent_required" }),
  }),
  language: z.enum(["de", "en"]),
  /** Honeypot — must be blank. Bots usually fill every field. */
  website: z.string().max(0, "errors.bot_detected").optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
