// src/services/vehicles/vehicles.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, VehiclePublic } from "@/types";

export async function fetchVehicles(locale: Locale): Promise<VehiclePublic[]> {
  return nextjsApiClient.get<VehiclePublic[]>("/public/vehicles", { params: { locale } });
}
