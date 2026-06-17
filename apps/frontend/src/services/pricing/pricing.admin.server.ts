// apps/frontend/src/services/pricing/pricing.admin.server.ts
// Admin pricing server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingCategoryAdmin, PricingItemAdmin } from "@/types";
import type {
  PricingCategoryCreateInput,
  PricingCategoryUpdateInput,
  PricingItemCreateInput,
  PricingItemUpdateInput,
} from "./pricing.admin.client";

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

// ---------- Categories ----------

export async function listAdminPricingCategoriesServer(serviceId: string, authToken: string): Promise<PricingCategoryAdmin[]> {
  return unwrap(await serverApiClient.get<PricingCategoryAdmin[]>(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId), undefined, authToken));
}

export async function createAdminPricingCategoryServer(serviceId: string, data: PricingCategoryCreateInput, authToken: string): Promise<PricingCategoryAdmin> {
  const c = unwrap(await serverApiClient.post<PricingCategoryAdmin>(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId));
  return c;
}

export async function getAdminPricingCategoryServer(id: string, authToken: string): Promise<PricingCategoryAdmin> {
  return unwrap(await serverApiClient.get<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY(id), undefined, authToken));
}

export async function updateAdminPricingCategoryServer(id: string, data: PricingCategoryUpdateInput, authToken: string): Promise<PricingCategoryAdmin> {
  const c = unwrap(await serverApiClient.patch<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_CATEGORY(id));
  return c;
}

export async function deleteAdminPricingCategoryServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.PRICING_CATEGORY(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_CATEGORY(id));
}

export async function restoreAdminPricingCategoryServer(id: string, authToken: string): Promise<PricingCategoryAdmin> {
  const c = unwrap(await serverApiClient.post<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_CATEGORY_RESTORE(id));
  return c;
}

// ---------- Items ----------

export async function createAdminPricingItemServer(categoryId: string, data: PricingItemCreateInput, authToken: string): Promise<PricingItemAdmin> {
  const i = unwrap(await serverApiClient.post<PricingItemAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY_ITEMS(categoryId), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_CATEGORY_ITEMS(categoryId));
  return i;
}

export async function updateAdminPricingItemServer(id: string, data: PricingItemUpdateInput, authToken: string): Promise<PricingItemAdmin> {
  const i = unwrap(await serverApiClient.patch<PricingItemAdmin>(ENDPOINTS.ADMIN.PRICING_ITEM(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_ITEM(id));
  return i;
}

export async function deleteAdminPricingItemServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.PRICING_ITEM(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_ITEM(id));
}

export async function restoreAdminPricingItemServer(id: string, authToken: string): Promise<PricingItemAdmin> {
  const i = unwrap(await serverApiClient.post<PricingItemAdmin>(ENDPOINTS.ADMIN.PRICING_ITEM_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.PRICING_ITEM_RESTORE(id));
  return i;
}
