// apps/frontend/src/services/customers/customers.admin.server.ts
// Admin customers server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { CustomerAdmin, CustomerInput } from "./customers.admin.client";
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

export async function listAdminCustomersServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<CustomerAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<CustomerAdmin>>(ENDPOINTS.ADMIN.CUSTOMERS, { params }, authToken));
}

export async function getAdminCustomerServer(id: string, authToken: string): Promise<CustomerAdmin> {
  return unwrap(await serverApiClient.get<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id), undefined, authToken));
}

export async function createAdminCustomerServer(data: CustomerInput, authToken: string): Promise<CustomerAdmin> {
  const c = unwrap(await serverApiClient.post<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMERS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.CUSTOMERS);
  return c;
}

export async function updateAdminCustomerServer(id: string, data: Partial<CustomerInput>, authToken: string): Promise<CustomerAdmin> {
  const c = unwrap(await serverApiClient.patch<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.CUSTOMERS);
  return c;
}

export async function deleteAdminCustomerServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.CUSTOMERS);
}

export async function listCustomerOrdersServer(id: string, authToken: string): Promise<CourierOrder[]> {
  return unwrap(await serverApiClient.get<CourierOrder[]>(ENDPOINTS.ADMIN.CUSTOMER_ORDERS(id), undefined, authToken));
}
