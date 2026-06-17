// src/services/pricing/pricing.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingCategoryAdmin, PricingItemAdmin } from "@/types";

export interface PricingCategoryCreateInput {
  sort_order?: number;
  name_de: string;
  name_en: string;
  description_de?: string | null;
  description_en?: string | null;
}
export type PricingCategoryUpdateInput = Partial<PricingCategoryCreateInput>;

export interface PricingItemCreateInput {
  sort_order?: number;
  from_location_de?: string | null;
  from_location_en?: string | null;
  to_location_de?: string | null;
  to_location_en?: string | null;
  /** String (e.g. "45.50") to preserve precision. */
  price_eur: string;
  note_de?: string | null;
  note_en?: string | null;
}
export type PricingItemUpdateInput = Partial<PricingItemCreateInput>;

// ---------- Categories ----------

export async function listAdminPricingCategories(
  serviceId: string,
): Promise<PricingCategoryAdmin[]> {
  return nextjsApiClient.get<PricingCategoryAdmin[]>(
    ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId),
  );
}

export async function createAdminPricingCategory(
  serviceId: string,
  payload: PricingCategoryCreateInput,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.post<PricingCategoryAdmin>(
    ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId),
    payload,
  );
}

export async function getAdminPricingCategory(
  categoryId: string,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.get<PricingCategoryAdmin>(
    ENDPOINTS.ADMIN.PRICING_CATEGORY(categoryId),
  );
}

export async function updateAdminPricingCategory(
  categoryId: string,
  payload: PricingCategoryUpdateInput,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.patch<PricingCategoryAdmin>(
    ENDPOINTS.ADMIN.PRICING_CATEGORY(categoryId),
    payload,
  );
}

export async function deleteAdminPricingCategory(categoryId: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.PRICING_CATEGORY(categoryId));
}

export async function restoreAdminPricingCategory(
  categoryId: string,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.post<PricingCategoryAdmin>(
    ENDPOINTS.ADMIN.PRICING_CATEGORY_RESTORE(categoryId),
  );
}

// ---------- Items ----------

export async function createAdminPricingItem(
  categoryId: string,
  payload: PricingItemCreateInput,
): Promise<PricingItemAdmin> {
  return nextjsApiClient.post<PricingItemAdmin>(
    ENDPOINTS.ADMIN.PRICING_CATEGORY_ITEMS(categoryId),
    payload,
  );
}

export async function updateAdminPricingItem(
  itemId: string,
  payload: PricingItemUpdateInput,
): Promise<PricingItemAdmin> {
  return nextjsApiClient.patch<PricingItemAdmin>(
    ENDPOINTS.ADMIN.PRICING_ITEM(itemId),
    payload,
  );
}

export async function deleteAdminPricingItem(itemId: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.PRICING_ITEM(itemId));
}

export async function restoreAdminPricingItem(itemId: string): Promise<PricingItemAdmin> {
  return nextjsApiClient.post<PricingItemAdmin>(
    ENDPOINTS.ADMIN.PRICING_ITEM_RESTORE(itemId),
  );
}
