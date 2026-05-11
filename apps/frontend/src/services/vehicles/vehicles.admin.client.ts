// src/services/vehicles/vehicles.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, VehicleAdmin } from "@/types";

export interface ListAdminVehiclesParams {
  page?: number;
  size?: number;
  q?: string;
  include_deleted?: boolean;
}

export interface VehicleCreateInput {
  sort_order?: number;
  active?: boolean;
  name_de: string;
  name_en: string;
  category: string;
  capacity_passengers: number;
  capacity_luggage?: number;
  features_de?: string[];
  features_en?: string[];
  image_url?: string | null;
}

export type VehicleUpdateInput = Partial<VehicleCreateInput>;

export async function listAdminVehicles(
  params: ListAdminVehiclesParams = {},
): Promise<Paginated<VehicleAdmin>> {
  return nextjsApiClient.get<Paginated<VehicleAdmin>>("/admin/vehicles", {
    params: { ...params },
  });
}

export async function getAdminVehicle(id: string): Promise<VehicleAdmin> {
  return nextjsApiClient.get<VehicleAdmin>(`/admin/vehicles/${id}`);
}

export async function createAdminVehicle(payload: VehicleCreateInput): Promise<VehicleAdmin> {
  return nextjsApiClient.post<VehicleAdmin>("/admin/vehicles", payload);
}

export async function updateAdminVehicle(
  id: string,
  payload: VehicleUpdateInput,
): Promise<VehicleAdmin> {
  return nextjsApiClient.patch<VehicleAdmin>(`/admin/vehicles/${id}`, payload);
}

export async function deleteAdminVehicle(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/vehicles/${id}`);
}

export async function restoreAdminVehicle(id: string): Promise<VehicleAdmin> {
  return nextjsApiClient.post<VehicleAdmin>(`/admin/vehicles/${id}/restore`);
}
