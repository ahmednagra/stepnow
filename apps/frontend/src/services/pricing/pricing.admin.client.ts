// src/services/pricing/pricing.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
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
    `/admin/services/${serviceId}/pricing-categories`,
  );
}

export async function createAdminPricingCategory(
  serviceId: string,
  payload: PricingCategoryCreateInput,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.post<PricingCategoryAdmin>(
    `/admin/services/${serviceId}/pricing-categories`,
    payload,
  );
}

export async function getAdminPricingCategory(
  categoryId: string,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.get<PricingCategoryAdmin>(
    `/admin/pricing-categories/${categoryId}`,
  );
}

export async function updateAdminPricingCategory(
  categoryId: string,
  payload: PricingCategoryUpdateInput,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.patch<PricingCategoryAdmin>(
    `/admin/pricing-categories/${categoryId}`,
    payload,
  );
}

export async function deleteAdminPricingCategory(categoryId: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/pricing-categories/${categoryId}`);
}

export async function restoreAdminPricingCategory(
  categoryId: string,
): Promise<PricingCategoryAdmin> {
  return nextjsApiClient.post<PricingCategoryAdmin>(
    `/admin/pricing-categories/${categoryId}/restore`,
  );
}

// ---------- Items ----------

export async function createAdminPricingItem(
  categoryId: string,
  payload: PricingItemCreateInput,
): Promise<PricingItemAdmin> {
  return nextjsApiClient.post<PricingItemAdmin>(
    `/admin/pricing-categories/${categoryId}/items`,
    payload,
  );
}

export async function updateAdminPricingItem(
  itemId: string,
  payload: PricingItemUpdateInput,
): Promise<PricingItemAdmin> {
  return nextjsApiClient.patch<PricingItemAdmin>(
    `/admin/pricing-items/${itemId}`,
    payload,
  );
}

export async function deleteAdminPricingItem(itemId: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/pricing-items/${itemId}`);
}

export async function restoreAdminPricingItem(itemId: string): Promise<PricingItemAdmin> {
  return nextjsApiClient.post<PricingItemAdmin>(
    `/admin/pricing-items/${itemId}/restore`,
  );
}
