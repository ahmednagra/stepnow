// src/schemas/admin-order.schema.ts
// Parcel/courier transport-order create form (admin orders/new). An order is anchored to a
// VEHICLE first; the driver is a secondary free-text field that may link to a registered driver.
// The customer is either a linked saved customer (customer_id) OR inline first/last + contact.

import { z } from "zod";
import { normalizeDecimalInput } from "@/utils/decimal";

// Loose but practical email check — mirrors what the backend will accept.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICE_TYPE_VALUES = [
  "Personenbeförderung",
  "Kuriertransport",
  "Umzugstransport",
  "Sonderfahrt",
] as const;

export const adminOrderSchema = z
  .object({
    // ── Order header ──
    order_date: z.string().min(1, "Order date is required"),
    preferred_date: z.string(),
    vehicle_id: z.string().min(1, "Vehicle is required"),
    driver_name: z.string(),
    driver_id: z.string().nullable(),

    // ── Customer ──
    customer_id: z.string().nullable(),
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    street: z.string(),
    plz: z.string(),
    ort: z.string(),
    email: z
      .string()
      .trim()
      .refine((v) => !v || EMAIL_RE.test(v), "Email format looks invalid"),
    phone: z.string(),
    vat_id: z.string(),
    client_reference: z.string(),

    // ── Route ──
    pickup: z.string().trim().min(1, "Pickup address is required"),
    dropoff: z.string().trim().min(1, "Destination address is required"),
    route_km: z.string(),
    service_type: z.enum(SERVICE_TYPE_VALUES).or(z.literal("")),

    // ── Pricing ──
    net: z
      .string()
      .refine((v) => {
        const n = normalizeDecimalInput(v);
        return !!n && Number(n) > 0;
      }, "Enter a valid net amount (e.g. 39.00)"),
    vat: z.string(),

    // ── Logbook ──
    km_total: z.string(),
    km_occupied: z.string(),

    // ── Payment + description ──
    term: z.number().nullable(),
    service_description: z.string(),
  })
  // Customer rule: a linked saved customer (customer_id) OR inline first + last name.
  // first/last are already required above, so this guards the inline branch explicitly.
  .superRefine((val, ctx) => {
    if (!val.customer_id) {
      if (!val.first_name.trim())
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["first_name"], message: "First name is required" });
      if (!val.last_name.trim())
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["last_name"], message: "Last name is required" });
    }
    if (val.term == null)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["term"], message: "Select a payment term (15 / 30 / 45 days)" });
  });

export type AdminOrderInput = z.infer<typeof adminOrderSchema>;
