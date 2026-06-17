// src/services/vehicles/vehicles.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
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
  public_visible?: boolean;
  plate?: string | null;
  ownership_type?: string | null;
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
  return nextjsApiClient.get<Paginated<VehicleAdmin>>(ENDPOINTS.ADMIN.VEHICLES, {
    params: { ...params },
  });
}

export async function getAdminVehicle(id: string): Promise<VehicleAdmin> {
  return nextjsApiClient.get<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id));
}

/**
 * Active, non-deleted vehicles for order assignment, ordered by sort_order.
 * Filtering is done client-side so it works regardless of backend query params.
 */
export async function listActiveVehicles(): Promise<VehicleAdmin[]> {
  const res = await listAdminVehicles({ size: 100 });
  return res.items
    .filter((v) => v.active && !v.is_deleted)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Operational fleet only — the plate-bearing cars that actually perform jobs (excludes the
 * pure public-showcase rows). This is what a transport/courier order should be anchored to.
 * Sorted by plate for a predictable picker order.
 */
export async function listFleetVehicles(): Promise<VehicleAdmin[]> {
  const res = await listAdminVehicles({ size: 100 });
  return res.items
    .filter((v) => v.active && !v.is_deleted && !!v.plate)
    .sort((a, b) => (a.plate ?? "").localeCompare(b.plate ?? ""));
}

/** Display label for a vehicle in pickers — the plate for fleet cars, else the marketing name. */
export function vehicleLabel(v: VehicleAdmin): string {
  return v.plate ? v.plate : v.name_de;
}

export async function createAdminVehicle(payload: VehicleCreateInput): Promise<VehicleAdmin> {
  return nextjsApiClient.post<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLES, payload);
}

export async function updateAdminVehicle(
  id: string,
  payload: VehicleUpdateInput,
): Promise<VehicleAdmin> {
  return nextjsApiClient.patch<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), payload);
}

export async function deleteAdminVehicle(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id));
}

export async function restoreAdminVehicle(id: string): Promise<VehicleAdmin> {
  return nextjsApiClient.post<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_RESTORE(id));
}
