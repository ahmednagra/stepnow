// apps/frontend/src/services/vehicles/vehicles.admin.server.ts
// Admin vehicles server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, VehicleAdmin } from "@/types";
import type { VehicleCreateInput, VehicleUpdateInput } from "./vehicles.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function listAdminVehiclesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<VehicleAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<VehicleAdmin>>(ENDPOINTS.ADMIN.VEHICLES, { params }, authToken));
}

export async function getAdminVehicleServer(id: string, authToken: string): Promise<VehicleAdmin> {
  return unwrap(await serverApiClient.get<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), undefined, authToken));
}

export async function createAdminVehicleServer(data: VehicleCreateInput, authToken: string): Promise<VehicleAdmin> {
  const v = unwrap(await serverApiClient.post<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLES, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.VEHICLES);
  return v;
}

export async function updateAdminVehicleServer(id: string, data: VehicleUpdateInput, authToken: string): Promise<VehicleAdmin> {
  const v = unwrap(await serverApiClient.patch<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.VEHICLES);
  return v;
}

export async function deleteAdminVehicleServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.VEHICLES);
}

export async function restoreAdminVehicleServer(id: string, authToken: string): Promise<VehicleAdmin> {
  const v = unwrap(await serverApiClient.post<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.VEHICLES);
  return v;
}
