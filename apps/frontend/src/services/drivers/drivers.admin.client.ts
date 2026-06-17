// src/services/drivers/drivers.admin.client.ts
// Admin client for drivers. Mirrors orders.admin.client.ts (nextjsApiClient + self-contained types).

import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";

export type ComplianceStatus = "ok" | "due" | "expired" | "blocked" | "unknown";

export interface DriverAdmin {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  vehicle_id: string | null;
  vehicle_label: string | null;
  active: boolean;
  internal_notes: string | null;
  // Compliance (§21 StVG / §48 FeV)
  license_number: string | null;
  license_classes: string[] | null;
  license_expiry: string | null;          // ISO date
  license_restrictions: string | null;
  pschein_number: string | null;
  pschein_expiry: string | null;           // ISO date
  last_license_check_at: string | null;    // ISO date
  next_license_check_due: string | null;   // ISO date
  last_checked_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Derived (computed server-side)
  compliance_status: ComplianceStatus;
  orders_count: number;
  last_dispatch_at: string | null;
}

export interface DriverInput {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  vehicle_id?: string | null;
  vehicle_label?: string | null;
  active?: boolean;
  internal_notes?: string | null;
  license_number?: string | null;
  license_classes?: string[] | null;
  license_expiry?: string | null;
  license_restrictions?: string | null;
  pschein_number?: string | null;
  pschein_expiry?: string | null;
}

export interface LicenseCheckInput {
  checked_on?: string;        // ISO date; defaults to today server-side
  interval_months?: number;   // defaults to 6
  notes?: string;
}

export interface ListDriversParams {
  page?: number;
  size?: number;
  q?: string;
  active_only?: boolean;
  include_deleted?: boolean;
}

export async function listAdminDrivers(params: ListDriversParams = {}): Promise<Paginated<DriverAdmin>> {
  return nextjsApiClient.get<Paginated<DriverAdmin>>(ENDPOINTS.ADMIN.DRIVERS, { params: { ...params } });
}
export async function getAdminDriver(id: string): Promise<DriverAdmin> {
  return nextjsApiClient.get<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id));
}
export async function createAdminDriver(payload: DriverInput): Promise<DriverAdmin> {
  return nextjsApiClient.post<DriverAdmin>(ENDPOINTS.ADMIN.DRIVERS, payload);
}
export async function updateAdminDriver(id: string, payload: Partial<DriverInput>): Promise<DriverAdmin> {
  return nextjsApiClient.patch<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id), payload);
}
/** Record a §21 StVG licence inspection — stamps last-check + recomputes next-due. */
export async function recordLicenseCheck(id: string, payload: LicenseCheckInput = {}): Promise<DriverAdmin> {
  return nextjsApiClient.post<DriverAdmin>(ENDPOINTS.ADMIN.DRIVER_LICENSE_CHECK(id), payload);
}
export async function deleteAdminDriver(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.DRIVER_BY_ID(id));
}

import type { CourierOrder } from "@/services/courier";
/** Job history for a driver. */
export async function listDriverOrders(id: string): Promise<CourierOrder[]> {
  return nextjsApiClient.get<CourierOrder[]>(ENDPOINTS.ADMIN.DRIVER_ORDERS(id));
}
