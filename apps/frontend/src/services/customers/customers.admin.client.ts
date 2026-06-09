// src/services/customers/customers.admin.client.ts
// Admin client for customers + the repeat-customer search (name OR phone).

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated } from "@/types";

export interface CustomerAdmin {
  id: string;
  first_name: string;
  last_name: string;
  is_business: boolean;
  company_name: string | null;
  company_vatid: string | null;
  street: string | null;
  plz: string | null;
  ort: string | null;
  email: string | null;
  phone: string | null;
  internal_notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  orders_count: number;
  total_billed: string;
  balance_due: string;
  overdue_balance: string;
  last_order_at: string | null;
}

export interface CustomerInput {
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
  internal_notes?: string | null;
}

function qs(params: Record<string, unknown>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export async function listAdminCustomers(params: { page?: number; size?: number; q?: string } = {}): Promise<Paginated<CustomerAdmin>> {
  return nextjsApiClient.get<Paginated<CustomerAdmin>>(`/admin/customers${qs(params)}`);
}
/** Debounced repeat-customer search by name or phone (returns the page items). */
export async function searchCustomers(q: string): Promise<CustomerAdmin[]> {
  if (!q.trim()) return [];
  const res = await nextjsApiClient.get<Paginated<CustomerAdmin>>(`/admin/customers${qs({ q, size: 8 })}`);
  return res.items;
}
export async function getAdminCustomer(id: string): Promise<CustomerAdmin> {
  return nextjsApiClient.get<CustomerAdmin>(`/admin/customers/${id}`);
}
export async function createAdminCustomer(payload: CustomerInput): Promise<CustomerAdmin> {
  return nextjsApiClient.post<CustomerAdmin>(`/admin/customers`, payload);
}
export async function updateAdminCustomer(id: string, payload: Partial<CustomerInput>): Promise<CustomerAdmin> {
  return nextjsApiClient.patch<CustomerAdmin>(`/admin/customers/${id}`, payload);
}
export async function deleteAdminCustomer(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/customers/${id}`);
}

import type { CourierOrder } from "@/services/courier";
/** Order history for a customer (for the detail page + outstanding balance). */
export async function listCustomerOrders(id: string): Promise<CourierOrder[]> {
  return nextjsApiClient.get<CourierOrder[]>(`/admin/customers/${id}/orders`);
}
