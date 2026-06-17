// src/schemas/admin-customer.schema.ts
import { z } from "zod";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminCustomerSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required.").max(200),
  contact_person: optStr(200),
  is_business: z.boolean(),
  company_vatid: optStr(50),
  tax_number: optStr(50),
  email: z
    .string()
    .trim()
    .max(200)
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  phone: optStr(50),
  street: optStr(200),
  plz: optStr(20),
  ort: optStr(120),
  internal_notes: optStr(2000),
});

export type AdminCustomerInput = z.infer<typeof adminCustomerSchema>;
