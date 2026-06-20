// src/services/courier/courier.admin.client.ts
// Admin client for the parcel-dispatch feature (manual courier orders + delivery lifecycle
// + driver slip). Money is string end-to-end to preserve precision (matches orders service).

import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import { getAccessToken } from "@/lib/auth-storage";
import { ApiError } from "@/lib/api-errors";
import type { Paginated } from "@/types";

export type DeliveryStatus = "draft" | "dispatched" | "picked_up" | "delivered";
export type StopType = "pickup" | "drop";

export interface OrderStop {
  id: string;
  sequence: number;
  stop_type: StopType;
  status: string;
  company: string | null;
  address: string;
  postcode: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  time_from: string | null;
  time_to: string | null;
  package_count: number | null;
  weight_kg: string | null;
  notes: string | null;
}

export interface OrderStopInput {
  stop_type: StopType;
  company?: string | null;
  address: string;
  postcode?: string | null;
  city?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  time_from?: string | null;
  time_to?: string | null;
  package_count?: number | null;
  weight_kg?: string | null;
  notes?: string | null;
}

export interface CourierOrder {
  whatsapp_link?: string | null;
  id: string;
  order_number: string;
  status: string;
  delivery_status: DeliveryStatus;
  customer_id: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  driver_name: string | null;
  client_reference: string | null;
  service_type: string | null;
  preferred_date: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_address: string;
  pickup_city: string | null;
  destination_address: string;
  destination_city: string | null;
  stops: OrderStop[];
  consignee: string | null;
  parcel_description: string | null;
  parcel_quantity: number;
  parcel_weight_kg: string | null;
  distance_km: string | null;
  total_km: string | null;
  occupied_km: string | null;
  km_to_load: string | null;
  km_to_unload: string | null;
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
  company_name: string;
  contact_person?: string | null;
  is_business?: boolean;
  company_vatid?: string | null;
  tax_number?: string | null;
  street?: string | null;
  plz?: string | null;
  ort?: string | null;
  email?: string | null;
  phone?: string | null;
}

export type ServiceType =
  | "Personenbeförderung"
  | "Kuriertransport"
  | "Umzugstransport"
  | "Sonderfahrt";

export interface ParcelOrderInput {
  customer_id?: string | null;
  customer?: InlineCustomerInput | null;
  // Vehicle is the primary anchor; driver_name is the secondary free-text field.
  vehicle_id?: string | null;
  driver_id?: string | null;
  driver_name?: string | null;
  client_reference?: string | null;
  service_type?: ServiceType | null;
  preferred_date?: string | null;
  stops: OrderStopInput[];
  consignee?: string | null;
  parcel_description?: string | null;
  parcel_quantity?: number;
  parcel_weight_kg?: string | null;
  distance_km?: string | null;
  total_km?: string | null;
  occupied_km?: string | null;
  km_to_load?: string | null;
  km_to_unload?: string | null;
  scheduled_datetime?: string | null;
  net_amount: string;
  vat_rate?: string;
  payment_due_days?: number;
  service_description?: string | null;
  internal_notes?: string | null;
}

export async function listParcelOrders(params: { page?: number; size?: number; delivery_status?: DeliveryStatus; q?: string } = {}): Promise<Paginated<CourierOrder>> {
  return nextjsApiClient.get<Paginated<CourierOrder>>(ENDPOINTS.ADMIN.PARCEL_ORDERS, { params });
}
export async function createParcelOrder(payload: ParcelOrderInput): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.PARCEL_ORDERS, payload);
}
export async function updateParcelOrder(orderId: string, payload: ParcelOrderInput): Promise<CourierOrder> {
  return nextjsApiClient.patch<CourierOrder>(ENDPOINTS.ADMIN.ORDER_PARCEL(orderId), payload);
}
export async function setDeliveryStatus(orderId: string, delivery_status: DeliveryStatus): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.ORDER_DELIVERY_STATUS(orderId), { delivery_status });
}

export async function sendDocuments(
  orderId: string,
  to: Array<"driver" | "customer">,
  channel: "email" | "whatsapp" = "email",
): Promise<CourierOrder> {
  return nextjsApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.ORDER_SEND(orderId), { to, channel });
}

/** Initiate a WhatsApp web-click handoff of the driver slip. Returns the order with
 *  whatsapp_link populated — open it with window.open to launch WhatsApp Web. */
export async function sendDriverSlipWhatsApp(orderId: string): Promise<CourierOrder> {
  return sendDocuments(orderId, ["driver"], "whatsapp");
}

/** Authenticated slip PDF — proxied through the Next API (same base nextjsApiClient uses). */
export function slipPdfHref(orderId: string): string {
  return `/api/v0/admin/orders/${orderId}/slip/pdf`;
}

function filenameFromDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Download the driver-slip PDF. A plain link / window.open can't send the Authorization header
 *  (the token lives in localStorage), so we fetch the stream with the bearer header and save the
 *  resulting blob. Throws ApiError on a non-200 so the caller can surface a toast. */
export async function downloadSlipPdf(orderId: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(slipPdfHref(orderId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = "Could not generate the PDF";
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
    } catch { /* binary / empty error body */ }
    throw new ApiError("PDF_ERROR", message, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameFromDisposition(res.headers.get("Content-Disposition")) ?? `Fahrauftrag-${orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
