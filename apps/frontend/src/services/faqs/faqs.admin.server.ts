// apps/frontend/src/services/faqs/faqs.admin.server.ts
// Admin faqs server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, FaqAdmin } from "@/types";
import type { FaqCreateInput, FaqUpdateInput } from "./faqs.admin.client";

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

export async function listAdminFaqsServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<FaqAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<FaqAdmin>>(ENDPOINTS.ADMIN.FAQS, { params }, authToken));
}

export async function getAdminFaqServer(id: string, authToken: string): Promise<FaqAdmin> {
  return unwrap(await serverApiClient.get<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_BY_ID(id), undefined, authToken));
}

export async function createAdminFaqServer(data: FaqCreateInput, authToken: string): Promise<FaqAdmin> {
  const v = unwrap(await serverApiClient.post<FaqAdmin>(ENDPOINTS.ADMIN.FAQS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.FAQS);
  return v;
}

export async function updateAdminFaqServer(id: string, data: FaqUpdateInput, authToken: string): Promise<FaqAdmin> {
  const v = unwrap(await serverApiClient.patch<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.FAQS);
  return v;
}

export async function deleteAdminFaqServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.FAQ_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.FAQS);
}

export async function restoreAdminFaqServer(id: string, authToken: string): Promise<FaqAdmin> {
  const v = unwrap(await serverApiClient.post<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.FAQS);
  return v;
}
