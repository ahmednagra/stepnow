// src/services/customers/customers.admin.client.ts
// Admin client for customers + the repeat-customer search (name OR phone).

import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";

export interface CustomerAdmin {
  id: string;
  company_name: string;
  contact_person: string | null;
  is_business: boolean;
  company_vatid: string | null;
  tax_number: string | null;
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
  internal_notes?: string | null;
}

export async function listAdminCustomers(params: { page?: number; size?: number; q?: string } = {}): Promise<Paginated<CustomerAdmin>> {
  return nextjsApiClient.get<Paginated<CustomerAdmin>>(ENDPOINTS.ADMIN.CUSTOMERS, { params });
}
/** Debounced repeat-customer search by name or phone (returns the page items). */
export async function searchCustomers(q: string): Promise<CustomerAdmin[]> {
  if (!q.trim()) return [];
  const res = await nextjsApiClient.get<Paginated<CustomerAdmin>>(ENDPOINTS.ADMIN.CUSTOMERS, { params: { q, size: 8 } });
  return res.items;
}
export async function getAdminCustomer(id: string): Promise<CustomerAdmin> {
  return nextjsApiClient.get<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id));
}
export async function createAdminCustomer(payload: CustomerInput): Promise<CustomerAdmin> {
  return nextjsApiClient.post<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMERS, payload);
}
export async function updateAdminCustomer(id: string, payload: Partial<CustomerInput>): Promise<CustomerAdmin> {
  return nextjsApiClient.patch<CustomerAdmin>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id), payload);
}
export async function deleteAdminCustomer(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.CUSTOMER_BY_ID(id));
}

import type { CourierOrder } from "@/services/courier";
/** Order history for a customer (for the detail page + outstanding balance). */
export async function listCustomerOrders(id: string): Promise<CourierOrder[]> {
  return nextjsApiClient.get<CourierOrder[]>(ENDPOINTS.ADMIN.CUSTOMER_ORDERS(id));
}
