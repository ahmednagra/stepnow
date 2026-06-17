// apps/frontend/src/services/services/services.admin.server.ts
// Admin services server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ServiceAdmin, PricingCategoryAdmin } from "@/types";
import type { ServiceCreateInput, ServiceUpdateInput } from "./services.admin.client";

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

export async function listAdminServicesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<ServiceAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<ServiceAdmin>>(ENDPOINTS.ADMIN.SERVICES, { params }, authToken));
}

export async function getAdminServiceServer(id: string, authToken: string): Promise<ServiceAdmin> {
  return unwrap(await serverApiClient.get<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(id), undefined, authToken));
}

export async function createAdminServiceServer(data: ServiceCreateInput, authToken: string): Promise<ServiceAdmin> {
  const v = unwrap(await serverApiClient.post<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICES, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.SERVICES);
  return v;
}

export async function updateAdminServiceServer(id: string, data: ServiceUpdateInput, authToken: string): Promise<ServiceAdmin> {
  const v = unwrap(await serverApiClient.patch<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.SERVICES);
  return v;
}

export async function deleteAdminServiceServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.SERVICE_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.SERVICES);
}

export async function restoreAdminServiceServer(id: string, authToken: string): Promise<ServiceAdmin> {
  const v = unwrap(await serverApiClient.post<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.SERVICES);
  return v;
}

export async function listServicePricingCategoriesServer(serviceId: string, authToken: string): Promise<PricingCategoryAdmin[]> {
  return unwrap(await serverApiClient.get<PricingCategoryAdmin[]>(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId), undefined, authToken));
}
