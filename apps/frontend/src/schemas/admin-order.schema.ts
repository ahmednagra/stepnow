// src/schemas/admin-order.schema.ts
// Transport-order create form (admin orders/new). An order is anchored to a VEHICLE first; the
// driver is a secondary free-text field that may link to a registered driver. The customer is
// B2B (company-first): either a linked saved customer (customer_id) OR an inline company name.
// The route is a list of pickups (Abholung) consolidated into a single drop-off (Ziel).

import { z } from "zod";
import { normalizeDecimalInput } from "@/utils/decimal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICE_TYPE_VALUES = [
  "Personenbeförderung",
  "Kuriertransport",
  "Umzugstransport",
  "Sonderfahrt",
] as const;

// One route stop — address required; the rest optional. Same shape for pickups + the drop.
const stopSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  plz: z.string().trim().optional().or(z.literal("")),
  ort: z.string().trim().optional().or(z.literal("")),
  contact_name: z.string().trim().optional().or(z.literal("")),
  contact_phone: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const adminOrderSchema = z
  .object({
    // ── Order header ──
    order_date: z.string().min(1, "Order date is required"),
    preferred_date: z.string(),
    vehicle_id: z.string().min(1, "Vehicle is required"),
    driver_name: z.string(),
    driver_id: z.string().nullable(),

    // ── Customer (company-first / B2B) ──
    customer_id: z.string().nullable(),
    company_name: z.string().trim(),
    contact_person: z.string(),
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

    // ── Route: N pickups → 1 drop ──
    pickups: z.array(stopSchema).min(1, "At least one pickup is required"),
    dropoff: stopSchema,
    route_km: z.string(),
    service_type: z.enum(SERVICE_TYPE_VALUES).or(z.literal("")),

    // ── Pricing ──
    net: z
      .string()
      .refine((v) => {
        const n = normalizeDecimalInput(v);
        return !!n && Number(n) > 0;
      }, "Enter a valid net amount (e.g. 39.00)"),
    vat: z
      .string()
      .refine((v) => {
        const n = Number(v);
        return v !== "" && Number.isFinite(n) && n >= 0 && n <= 1;
      }, "Enter a VAT rate (0–100%)"),

    // ── Logbook ──
    km_total: z.string(),
    km_occupied: z.string(),

    // ── Payment + description ──
    term: z.number().nullable(),
    service_description: z.string(),
  })
  // Customer rule: a linked saved customer (customer_id) OR an inline company name.
  .superRefine((val, ctx) => {
    if (!val.customer_id && !val.company_name.trim())
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["company_name"], message: "Company name is required" });
    if (val.term == null)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["term"], message: "Select a payment term" });
  });

export type AdminOrderInput = z.infer<typeof adminOrderSchema>;
