// src/services/contact/contact.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, ContactMessageAdmin } from "@/types";

export interface ListAdminContactMessagesParams {
  page?: number;
  size?: number;
  is_handled?: boolean;
  subject_category?: string;
  q?: string;
  from_date?: string;
  to_date?: string;
  include_deleted?: boolean;
}

export interface ContactMessageUpdateInput {
  is_handled?: boolean;
  internal_notes?: string | null;
}

export async function listAdminContactMessages(
  params: ListAdminContactMessagesParams = {},
): Promise<Paginated<ContactMessageAdmin>> {
  // Coerce booleans to strings for URL params
  const flat: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    flat[k] = typeof v === "boolean" ? String(v) : (v as string | number);
  }
  return nextjsApiClient.get<Paginated<ContactMessageAdmin>>("/admin/contact-messages", {
    params: flat,
  });
}

export async function getAdminContactMessage(id: string): Promise<ContactMessageAdmin> {
  return nextjsApiClient.get<ContactMessageAdmin>(`/admin/contact-messages/${id}`);
}

export async function updateAdminContactMessage(
  id: string,
  payload: ContactMessageUpdateInput,
): Promise<ContactMessageAdmin> {
  return nextjsApiClient.patch<ContactMessageAdmin>(
    `/admin/contact-messages/${id}`,
    payload,
  );
}

export async function deleteAdminContactMessage(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/contact-messages/${id}`);
}
