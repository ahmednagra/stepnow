// apps/frontend/src/services/drivers/drivers.admin.server.ts
// Admin drivers server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { DriverAdmin, DriverInput, LicenseCheckInput } from "./drivers.admin.client";
import type { CourierOrder } from "@/services/courier";

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

export async function listAdminDriversServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<DriverAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<DriverAdmin>>(ENDPOINTS.ADMIN.DRIVERS, { params }, authToken));
}

export async function getAdminDriverServer(id: string, authToken: string): Promise<DriverAdmin> {
  return unwrap(await serverApiClient.get<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id), undefined, authToken));
}

export async function createAdminDriverServer(data: DriverInput, authToken: string): Promise<DriverAdmin> {
  const d = unwrap(await serverApiClient.post<DriverAdmin>(ENDPOINTS.ADMIN.DRIVERS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.DRIVERS);
  return d;
}

export async function updateAdminDriverServer(id: string, data: Partial<DriverInput>, authToken: string): Promise<DriverAdmin> {
  const d = unwrap(await serverApiClient.patch<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.DRIVERS);
  return d;
}

export async function deleteAdminDriverServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.DRIVERS);
}

export async function recordLicenseCheckServer(id: string, data: LicenseCheckInput, authToken: string): Promise<DriverAdmin> {
  const d = unwrap(await serverApiClient.post<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_LICENSE_CHECK(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.DRIVERS);
  return d;
}

export async function listDriverOrdersServer(id: string, authToken: string): Promise<CourierOrder[]> {
  return unwrap(await serverApiClient.get<CourierOrder[]>(ENDPOINTS.ADMIN.DRIVER_ORDERS(id), undefined, authToken));
}
