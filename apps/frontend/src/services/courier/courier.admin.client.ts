// src/services/courier/courier.admin.client.ts
// Admin client for the parcel-dispatch feature (manual courier orders + delivery lifecycle
// + driver slip). Money is string end-to-end to preserve precision (matches orders service).

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated } from "@/types";

export type DeliveryStatus = "draft" | "dispatched" | "picked_up" | "delivered";

export interface CourierOrder {
  id: string;
  order_number: string;
  status: string;                 // financial: open|completed|cancelled
  delivery_status: DeliveryStatus;
  customer_id: string | null;
  driver_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_address: string;
  pickup_city: string | null;
  destination_address: string;
  destination_city: string | null;
  consignee: string | null;
  parcel_description: string | null;
  parcel_quantity: number;
  parcel_weight_kg: string | null;
  scheduled_datetime: string | null;
  net_amount: string;
  vat_rate: string;
  vat_amount: string;
  gross_amount: string;
  payment_due_days: number;
  due_date: string | null;
  dispatched_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  driver_emailed_at: string | null;
  created_at: string;
}

export interface InlineCustomerInput {
  first_name: string;
  last_name: string;
  is_business?: boolean;
  company_name?: string | null;
  company_vatid?: string | null;
  street?: string | null;
  plz?: string | null;
  ort?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ParcelOrderInput {
  customer_id?: string | null;
  customer?: InlineCustomerInput | null;
  driver_id?: string | null;
  pickup_address: string;
  pickup_city?: string | null;
  destination_address: string;
  destination_city?: string | null;
  consignee?: string | null;
  parcel_description?: string | null;
  parcel_quantity?: number;
  parcel_weight_kg?: string | null;
  scheduled_datetime?: string | null;
  net_amount: string;
  vat_rate?: string;
  payment_due_days?: number;
  service_description?: string | null;
  internal_notes?: string | null;
}

function qs(params: Record<string, unknown>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export async function listParcelOrders(params: { page?: number; size?: number; delivery_status?: DeliveryStatus; q?: string } = {}): Promise<Paginated<CourierOrder>> {
  return nextjsApiClient.get<Paginated<CourierOrder>>(`/admin/parcel-orders${qs(params)}`);
}
export async function createParcelOrder(payload: ParcelOrderInput): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(`/admin/parcel-orders`, payload);
}
export async function updateParcelOrder(orderId: string, payload: ParcelOrderInput): Promise<CourierOrder> {
  return nextjsApiClient.patch<CourierOrder>(`/admin/orders/${orderId}/parcel`, payload);
}
export async function setDeliveryStatus(orderId: string, delivery_status: DeliveryStatus): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(`/admin/orders/${orderId}/delivery-status`, { delivery_status });
}
export async function sendDocuments(orderId: string, to: Array<"driver" | "customer">): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(`/admin/orders/${orderId}/send`, { to });
}
/** Authenticated slip PDF — proxied through the Next API (same base nextjsApiClient uses). */
export function slipPdfHref(orderId: string): string {
  return `/api/admin/orders/${orderId}/slip/pdf`;
}
