// src/services/courier/courier.admin.client.ts
// Admin client for the parcel-dispatch feature (manual courier orders + delivery lifecycle
// + driver slip). Money is string end-to-end to preserve precision (matches orders service).

import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";

export type DeliveryStatus = "draft" | "dispatched" | "picked_up" | "delivered";

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
  consignee: string | null;
  parcel_description: string | null;
  parcel_quantity: number;
  parcel_weight_kg: string | null;
  distance_km: string | null;
  total_km: string | null;
  occupied_km: string | null;
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
  pickup_address: string;
  pickup_city?: string | null;
  destination_address: string;
  destination_city?: string | null;
  consignee?: string | null;
  parcel_description?: string | null;
  parcel_quantity?: number;
  parcel_weight_kg?: string | null;
  distance_km?: string | null;
  total_km?: string | null;
  occupied_km?: string | null;
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
