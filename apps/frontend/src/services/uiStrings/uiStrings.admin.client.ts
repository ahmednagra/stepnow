// src/services/uiStrings/uiStrings.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, UiStringAdmin } from "@/types";

export interface ListAdminUiStringsParams {
  page?: number;
  size?: number;
  q?: string;
  namespace?: string;
  include_deleted?: boolean;
}

export interface UiStringCreateInput {
  key: string;
  namespace: string;
  value_de: string;
  value_en: string;
  description?: string | null;
  is_locked?: boolean;
}

export interface UiStringUpdateInput {
  namespace?: string;
  value_de?: string;
  value_en?: string;
  description?: string | null;
  is_locked?: boolean;
}

export async function listAdminUiStrings(
  params: ListAdminUiStringsParams = {},
): Promise<Paginated<UiStringAdmin>> {
  return nextjsApiClient.get<Paginated<UiStringAdmin>>(ENDPOINTS.ADMIN.UI_STRINGS, {
    params: { ...params },
  });
}

export async function getAdminUiString(id: string): Promise<UiStringAdmin> {
  return nextjsApiClient.get<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id));
}

export async function createAdminUiString(payload: UiStringCreateInput): Promise<UiStringAdmin> {
  return nextjsApiClient.post<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRINGS, payload);
}

export async function updateAdminUiString(
  id: string,
  payload: UiStringUpdateInput,
): Promise<UiStringAdmin> {
  return nextjsApiClient.patch<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id), payload);
}

export async function deleteAdminUiString(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.UI_STRING_BY_ID(id));
}

export async function restoreAdminUiString(id: string): Promise<UiStringAdmin> {
  return nextjsApiClient.post<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_RESTORE(id));
}
