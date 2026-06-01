// src/services/drivers/drivers.admin.client.ts
// Admin client for drivers. Mirrors orders.admin.client.ts (nextjsApiClient + self-contained types).

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated } from "@/types";

export interface DriverAdmin {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  vehicle_id: string | null;
  vehicle_label: string | null;
  active: boolean;
  internal_notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverInput {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  vehicle_id?: string | null;
  vehicle_label?: string | null;
  active?: boolean;
  internal_notes?: string | null;
}

export interface ListDriversParams {
  page?: number;
  size?: number;
  q?: string;
  active_only?: boolean;
  include_deleted?: boolean;
}

function qs(params: Record<string, unknown>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export async function listAdminDrivers(params: ListDriversParams = {}): Promise<Paginated<DriverAdmin>> {
  return nextjsApiClient.get<Paginated<DriverAdmin>>(`/admin/drivers${qs(params)}`);
}
export async function getAdminDriver(id: string): Promise<DriverAdmin> {
  return nextjsApiClient.get<DriverAdmin>(`/admin/drivers/${id}`);
}
export async function createAdminDriver(payload: DriverInput): Promise<DriverAdmin> {
  return nextjsApiClient.post<DriverAdmin>(`/admin/drivers`, payload);
}
export async function updateAdminDriver(id: string, payload: Partial<DriverInput>): Promise<DriverAdmin> {
  return nextjsApiClient.patch<DriverAdmin>(`/admin/drivers/${id}`, payload);
}
export async function deleteAdminDriver(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/drivers/${id}`);
}

import type { CourierOrder } from "@/services/courier";
/** Job history for a driver. */
export async function listDriverOrders(id: string): Promise<CourierOrder[]> {
  return nextjsApiClient.get<CourierOrder[]>(`/admin/drivers/${id}/orders`);
}
