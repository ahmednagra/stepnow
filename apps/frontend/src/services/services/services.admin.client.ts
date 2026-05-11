// src/services/services/services.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, ServiceAdmin } from "@/types";

export interface ListAdminServicesParams {
  page?: number;
  size?: number;
  q?: string;
  include_deleted?: boolean;
}

export interface ServiceCreateInput {
  sort_order?: number;
  active?: boolean;
  icon?: string | null;
  slug_de: string;
  slug_en: string;
  title_de: string;
  title_en: string;
  short_description_de?: string | null;
  short_description_en?: string | null;
  long_description_de?: string | null;
  long_description_en?: string | null;
  hero_image_url?: string | null;
  og_image_url?: string | null;
  meta_title_de?: string | null;
  meta_title_en?: string | null;
  meta_description_de?: string | null;
  meta_description_en?: string | null;
}

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

export async function listAdminServices(
  params: ListAdminServicesParams = {},
): Promise<Paginated<ServiceAdmin>> {
  return nextjsApiClient.get<Paginated<ServiceAdmin>>("/admin/services", {
    params: { ...params },
  });
}

export async function getAdminService(id: string): Promise<ServiceAdmin> {
  return nextjsApiClient.get<ServiceAdmin>(`/admin/services/${id}`);
}

export async function createAdminService(payload: ServiceCreateInput): Promise<ServiceAdmin> {
  return nextjsApiClient.post<ServiceAdmin>("/admin/services", payload);
}

export async function updateAdminService(
  id: string,
  payload: ServiceUpdateInput,
): Promise<ServiceAdmin> {
  return nextjsApiClient.patch<ServiceAdmin>(`/admin/services/${id}`, payload);
}

export async function deleteAdminService(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/services/${id}`);
}

export async function restoreAdminService(id: string): Promise<ServiceAdmin> {
  return nextjsApiClient.post<ServiceAdmin>(`/admin/services/${id}/restore`);
}
