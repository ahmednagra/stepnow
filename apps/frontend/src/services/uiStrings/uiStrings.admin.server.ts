// apps/frontend/src/services/uiStrings/uiStrings.admin.server.ts
// Admin ui-strings server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, UiStringAdmin } from "@/types";
import type { UiStringCreateInput, UiStringUpdateInput } from "./uiStrings.admin.client";

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

export async function listAdminUiStringsServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<UiStringAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<UiStringAdmin>>(ENDPOINTS.ADMIN.UI_STRINGS, { params }, authToken));
}

export async function getAdminUiStringServer(id: string, authToken: string): Promise<UiStringAdmin> {
  return unwrap(await serverApiClient.get<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id), undefined, authToken));
}

export async function createAdminUiStringServer(data: UiStringCreateInput, authToken: string): Promise<UiStringAdmin> {
  const v = unwrap(await serverApiClient.post<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRINGS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.UI_STRINGS);
  return v;
}

export async function updateAdminUiStringServer(id: string, data: UiStringUpdateInput, authToken: string): Promise<UiStringAdmin> {
  const v = unwrap(await serverApiClient.patch<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.UI_STRINGS);
  return v;
}

export async function deleteAdminUiStringServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.UI_STRINGS);
}

export async function restoreAdminUiStringServer(id: string, authToken: string): Promise<UiStringAdmin> {
  const v = unwrap(await serverApiClient.post<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.UI_STRINGS);
  return v;
}
