// src/schemas/booking.schema.ts
// Per-step Zod schemas for the booking wizard. Each step validates only its
// own fields; the final composite assembles everything for the BookingCreate
// post to the BFF.
//
// Error messages are i18n keys; the wizard resolves them via t() at render
// time. Server-side validation is authoritative — these are UX-only.

import { z } from "zod";
import {
  LUGGAGE_MAX,
  LUGGAGE_MIN,
  MAX_ADVANCE_DAYS,
  MIN_LEAD_TIME_MINUTES,
  PASSENGER_MAX,
  PASSENGER_MIN,
} from "@/constants/booking-wizard";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

/**
 * Combine a `YYYY-MM-DD` date + `HH:MM` time string into a local Date object.
 * Returns null on parse failure. We treat times as the user's local time
 * (Europe/Berlin in practice).
 */
export function combineDateAndTime(date: string, time: string): Date | null {
  if (!dateRegex.test(date) || !timeRegex.test(time)) return null;
  const dt = new Date(`${date}T${time}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Convert the wizard's separate date+time into an ISO 8601 string for the API. */
export function combineToIso(date: string, time: string): string | null {
  const dt = combineDateAndTime(date, time);
  return dt ? dt.toISOString() : null;
}

// === Step 1 — service + datetime ====================================
export const step1Schema = z
  .object({
    service_id: z.string({ required_error: "errors.required" }).uuid("errors.required"),
    pickup_date: z
      .string({ required_error: "errors.required" })
      .regex(dateRegex, "booking.service.error.lead_time"),
    pickup_time: z
      .string({ required_error: "errors.required" })
      .regex(timeRegex, "booking.service.error.lead_time"),
  })
  .superRefine((value, ctx) => {
    const dt = combineDateAndTime(value.pickup_date, value.pickup_time);
    if (!dt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickup_time"],
        message: "booking.service.error.lead_time",
      });
      return;
    }
    const now = Date.now();
    const minLead = now + MIN_LEAD_TIME_MINUTES * 60_000;
    const maxAhead = now + MAX_ADVANCE_DAYS * 24 * 60 * 60_000;
    if (dt.getTime() < minLead) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickup_time"],
        message: "booking.service.error.lead_time",
      });
    } else if (dt.getTime() > maxAhead) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickup_date"],
        message: "booking.service.error.too_far",
      });
    }
  });

// === Step 2 — route =================================================
export const step2Schema = z.object({
  pickup_address: z
    .string({ required_error: "errors.required" })
    .trim()
    .min(3, "errors.required")
    .max(255, "errors.required"),
  pickup_postcode: z.string().trim().max(10).optional().or(z.literal("")),
  pickup_city: z.string().trim().max(80).optional().or(z.literal("")),
  destination_address: z
    .string({ required_error: "errors.required" })
    .trim()
    .min(3, "errors.required")
    .max(255, "errors.required"),
  destination_postcode: z.string().trim().max(10).optional().or(z.literal("")),
  destination_city: z.string().trim().max(80).optional().or(z.literal("")),
});

// === Step 3 — details ===============================================
export const step3Schema = z.object({
  passenger_count: z
    .number({ required_error: "errors.required", invalid_type_error: "errors.required" })
    .int()
    .min(PASSENGER_MIN, "errors.required")
    .max(PASSENGER_MAX, "errors.required"),
  luggage_count: z
    .number({ required_error: "errors.required", invalid_type_error: "errors.required" })
    .int()
    .min(LUGGAGE_MIN, "errors.required")
    .max(LUGGAGE_MAX, "errors.required"),
  special_requirements: z.string().trim().max(2000).optional().or(z.literal("")),
});

// === Step 4 — contact ===============================================
// is_business is a boolean toggle; when true, company_name is required.
export const step4Schema = z
  .object({
    customer_name: z
      .string({ required_error: "errors.required" })
      .trim()
      .min(2, "errors.required")
      .max(120, "errors.required"),
    customer_phone: z
      .string({ required_error: "errors.required" })
      .trim()
      .min(4, "errors.required")
      .max(40, "errors.required"),
    customer_email: z
      .string({ required_error: "errors.required" })
      .trim()
      .email("errors.required"),
    is_business: z.boolean().default(false),
    company_name: z.string().trim().max(120).optional().or(z.literal("")),
    company_vatid: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.is_business && !value.company_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_name"],
        message: "errors.required",
      });
    }
  });

// === Step 5 — review (just consent) =================================
export const step5Schema = z.object({
  consent_dsgvo: z.literal(true, {
    errorMap: () => ({ message: "errors.consent_required" }),
  }),
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

// === Composite — full booking ready for submission ==================
export const fullBookingSchema = step2Schema
  .and(step3Schema)
  .and(step5Schema)
  .and(
    z.object({
      service_id: z.string().uuid(),
      requested_datetime: z.string().min(1),
      customer_name: z.string().min(2),
      customer_phone: z.string().min(4),
      customer_email: z.string().email(),
      is_business: z.boolean(),
      company_name: z.string().optional(),
      company_vatid: z.string().optional(),
      language: z.enum(["de", "en"]),
    }),
  );

export type FullBooking = z.infer<typeof fullBookingSchema>;
