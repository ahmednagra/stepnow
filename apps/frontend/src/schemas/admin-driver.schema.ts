// src/schemas/admin-driver.schema.ts
import { z } from "zod";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminDriverSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required.").max(200),
  phone: optStr(50),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(200)
    .optional()
    .or(z.literal("")),
  vehicle_label: optStr(100),
  active: z.boolean(),
  license_number: optStr(100),
  license_classes: z.array(z.string()),
  license_expiry: optStr(20),
  license_restrictions: optStr(200),
  has_pschein: z.boolean(),
  pschein_number: optStr(100),
  pschein_expiry: optStr(20),
  internal_notes: optStr(2000),
});

export type AdminDriverInput = z.infer<typeof adminDriverSchema>;
