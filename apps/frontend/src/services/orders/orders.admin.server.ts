// apps/frontend/src/services/orders/orders.admin.server.ts
// Admin orders server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { CourierOrder } from "@/services/courier";
import type {
  OrderAdmin,
  OrderDetail,
  InvoiceAdmin,
  PaymentAdmin,
} from "./orders.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function listAdminOrdersServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<OrderAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<OrderAdmin>>(ENDPOINTS.ADMIN.ORDERS, { params }, authToken));
}

export async function getAdminOrderServer(id: string, authToken: string): Promise<OrderDetail> {
  return unwrap(await serverApiClient.get<OrderDetail>(ENDPOINTS.ADMIN.ORDER_BY_ID(id), undefined, authToken));
}

export async function updateAdminOrderServer(id: string, data: Record<string, unknown>, authToken: string): Promise<OrderDetail> {
  const o = unwrap(await serverApiClient.patch<OrderDetail>(ENDPOINTS.ADMIN.ORDER_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return o;
}

export async function deleteAdminOrderServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.ORDER_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
}

export async function sendAdminOrderServer(id: string, data: Record<string, unknown>, authToken: string): Promise<CourierOrder> {
  const o = unwrap(await serverApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.ORDER_SEND(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return o;
}

export async function createAdminOrderInvoiceServer(id: string, data: Record<string, unknown>, authToken: string): Promise<InvoiceAdmin> {
  const inv = unwrap(await serverApiClient.post<InvoiceAdmin>(ENDPOINTS.ADMIN.ORDER_INVOICE(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return inv;
}

export async function updateAdminOrderParcelServer(id: string, data: Record<string, unknown>, authToken: string): Promise<CourierOrder> {
  const o = unwrap(await serverApiClient.patch<CourierOrder>(ENDPOINTS.ADMIN.ORDER_PARCEL(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return o;
}

export async function listAdminOrderPaymentsServer(id: string, authToken: string): Promise<PaymentAdmin[]> {
  return unwrap(await serverApiClient.get<PaymentAdmin[]>(ENDPOINTS.ADMIN.ORDER_PAYMENTS(id), undefined, authToken));
}

export async function recordAdminOrderPaymentServer(id: string, data: Record<string, unknown>, authToken: string): Promise<PaymentAdmin> {
  const p = unwrap(await serverApiClient.post<PaymentAdmin>(ENDPOINTS.ADMIN.ORDER_PAYMENTS(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return p;
}

export async function setAdminOrderDeliveryStatusServer(id: string, data: Record<string, unknown>, authToken: string): Promise<CourierOrder> {
  const o = unwrap(await serverApiClient.post<CourierOrder>(ENDPOINTS.ADMIN.ORDER_DELIVERY_STATUS(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.ORDERS);
  return o;
}
