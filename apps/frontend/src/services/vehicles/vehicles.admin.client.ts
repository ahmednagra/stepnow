// src/services/vehicles/vehicles.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import { getAccessToken } from "@/lib/auth-storage";
import type { Paginated, VehicleAdmin } from "@/types";

// ── Per-vehicle ledger (account): order list + ORDER prices + totals ──
export interface VehicleLedgerOrder {
  order_id: string;
  order_number: string;
  date: string | null;
  customer_name: string;
  route_from: string | null;
  route_to: string | null;
  net_amount: string;
  gross_amount: string;
  currency: string;
  amount_paid: string;
  balance_due: string;
  status: string;
}
export interface VehicleLedger {
  vehicle_id: string;
  vehicle_label: string;
  date_from: string | null;
  date_to: string | null;
  orders: VehicleLedgerOrder[];
  totals: { count: number; net: string; gross: string; paid: string; balance: string };
}

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

export async function getVehicleLedger(id: string, params: { date_from?: string; date_to?: string } = {}): Promise<VehicleLedger> {
  return nextjsApiClient.get<VehicleLedger>(ENDPOINTS.ADMIN.VEHICLE_LEDGER(id), { params });
}

/** Authenticated vehicle-account PDF download (bearer header can't ride a plain link). */
export async function downloadVehicleLedgerPdf(id: string, label?: string, params: { date_from?: string; date_to?: string } = {}): Promise<void> {
  const token = getAccessToken();
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const res = await fetch(`/api/v0${ENDPOINTS.ADMIN.VEHICLE_LEDGER_PDF(id)}${qs ? `?${qs}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("PDF download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Fahrzeugkonto_${label ?? id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
