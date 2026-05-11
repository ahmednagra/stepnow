// src/schemas/admin-vehicle.schema.ts
import { z } from "zod";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const adminVehicleSchema = z.object({
  sort_order: z.coerce.number().int().min(0),
  active: z.boolean(),
  name_de: z.string().trim().min(1, "Required").max(200),
  name_en: z.string().trim().min(1, "Required").max(200),
  category: z.string().trim().min(1, "Required").max(50),
  capacity_passengers: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, "At least 1")
    .max(50),
  capacity_luggage: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0)
    .max(50),
  features_de: z.string().optional().or(z.literal("")),
  features_en: z.string().optional().or(z.literal("")),
  image_url: optStr(500),
});

export type AdminVehicleInput = z.infer<typeof adminVehicleSchema>;
