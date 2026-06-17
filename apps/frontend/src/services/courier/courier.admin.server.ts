// apps/frontend/src/services/courier/courier.admin.server.ts
// Admin courier (parcel-orders) server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { CourierOrder, ParcelOrderInput } from "./courier.admin.client";

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

export async function listParcelOrdersServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<CourierOrder>> {
  return unwrap(await serverApiClient.get<Paginated<CourierOrder>>(ENDPOINTS.ADMIN.PARCEL_ORDERS, { params }, authToken));
}

export async function createParcelOrderServer(data: ParcelOrderInput, authToken: string): Promise<CourierOrder> {
  const o = unwrap(await serverApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.PARCEL_ORDERS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PARCEL_ORDERS);
  return o;
}
