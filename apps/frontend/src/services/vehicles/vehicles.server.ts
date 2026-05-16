// apps/frontend/src/services/vehicles/vehicles.server.ts
// Public vehicles fetch. Revalidate 30min; admin-bff TAG_MAP invalidates "vehicles" on admin mutation.

import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, VehiclePublic } from "@/types";

const VEHICLES_REVALIDATE_SECONDS = 1800;

export async function listVehiclesServer(locale: Locale): Promise<VehiclePublic[]> {
const result = await serverApiClient.get<VehiclePublic[]>(ENDPOINTS.PUBLIC.VEHICLES, {
params: { locale },
revalidate: VEHICLES_REVALIDATE_SECONDS,
tags: ["vehicles", `vehicles:${locale}`],
});
if (result.error || !result.data) {
throw new ApiError(result.error?.code ?? "EMPTY_RESPONSE", result.error?.message ?? "No vehicles returned", result.status, result.error?.extra);
}
return result.data;
}
