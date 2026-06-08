// src/services/orders/orders.admin.client.ts
// Admin client for the order lifecycle. Mirrors bookings.admin.client.ts (nextjsApiClient,
// self-contained types in the spirit of services/admin-stats/index.ts).

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated } from "@/types";

export type OrderStatus = "open" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "girocard" | "bank_transfer" | "paypal" | "other";

export interface OrderAdmin {
  id: string;
  order_number: string;
  status: OrderStatus;
  booking_id: string | null;
  service_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_address: string;
  destination_address: string;
  scheduled_datetime: string | null;
  net_amount: string;
  vat_rate: string;
  vat_amount: string;
  gross_amount: string;
  due_date: string | null;
  created_at: string;
}

export interface PaymentAdmin {
  id: string;
  order_id: string;
  invoice_id: string | null;
  amount: string;
  method: PaymentMethod;
  status: string;
  received_at: string;
  reference: string | null;
  notes: string | null;
}

export interface InvoiceAdmin {
  id: string;
  invoice_number: string;
  order_id: string;
  status: string;
  issue_date: string;
  net_amount: string;
  vat_amount: string;
  gross_amount: string;
  due_date: string | null;
}

export interface OrderDetail extends OrderAdmin {
  invoice: InvoiceAdmin | null;
  payments: PaymentAdmin[];
  amount_paid: string;
  balance_due: string;
}

export interface ConvertBookingInput {
  net_amount: string;
  vat_rate?: string;          // "0.07" | "0.19" | undefined → backend default 0.07
  payment_due_days?: number;
  distance_km?: string;
  driver_name?: string;
  vehicle_id?: string;
  service_description?: string;
  scheduled_datetime?: string;
  internal_notes?: string;
}

export interface RecordPaymentInput {
  amount: string;
  method?: PaymentMethod;
  received_at?: string;
  invoice_id?: string;
  reference?: string;
  notes?: string;
}

export interface CreateInvoiceInput {
  issue_date?: string;
  payment_due_days?: number;
  recipient_block?: string;
  tax_number?: string;
  surcharge_label?: string;
  surcharge_net?: string;
  skonto_pct?: string;
  skonto_days?: number;
}

export interface ListAdminOrdersParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
  q?: string;
  include_deleted?: boolean;
}

export async function convertBookingToOrder(bookingId: string, payload: ConvertBookingInput): Promise<OrderDetail> {
  return nextjsApiClient.post<OrderDetail>(`/admin/bookings/${bookingId}/convert-to-order`, payload);
}

export async function listAdminOrders(params: ListAdminOrdersParams = {}): Promise<Paginated<OrderAdmin>> {
  return nextjsApiClient.get<Paginated<OrderAdmin>>("/admin/orders", { params: { ...params } });
}

export async function getAdminOrder(id: string): Promise<OrderDetail> {
  return nextjsApiClient.get<OrderDetail>(`/admin/orders/${id}`);
}

export async function updateAdminOrder(
  id: string,
  payload: { status?: OrderStatus; driver_name?: string | null; internal_notes?: string | null },
): Promise<OrderDetail> {
  return nextjsApiClient.patch<OrderDetail>(`/admin/orders/${id}`, payload);
}

export async function deleteAdminOrder(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/orders/${id}`);
}

export async function createOrderInvoice(orderId: string, payload: CreateInvoiceInput): Promise<InvoiceAdmin> {
  return nextjsApiClient.post<InvoiceAdmin>(`/admin/orders/${orderId}/invoice`, payload);
}

export async function listOrderPayments(orderId: string): Promise<PaymentAdmin[]> {
  return nextjsApiClient.get<PaymentAdmin[]>(`/admin/orders/${orderId}/payments`);
}

export async function recordOrderPayment(orderId: string, payload: RecordPaymentInput): Promise<PaymentAdmin> {
  return nextjsApiClient.post<PaymentAdmin>(`/admin/orders/${orderId}/payments`, payload);
}

/**
 * Authenticated download of the invoice PDF (it streams behind get_current_admin).
 * Goes through the Next BFF with the session cookie. If your nextjsApiClient uses a base
 * other than "/api", change the prefix below to match.
 */
export async function downloadInvoicePdf(orderId: string, invoiceNumber?: string): Promise<void> {
  const res = await fetch(`/api/v0/admin/orders/${orderId}/invoice/pdf`, { credentials: "include" });
  if (!res.ok) throw new Error("PDF download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber ?? "invoice"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
