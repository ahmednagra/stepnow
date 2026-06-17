// apps/frontend/src/services/contact/contact.admin.server.ts
// Admin contact-messages server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ContactMessageAdmin } from "@/types";
import type { ContactMessageUpdateInput } from "./contact.admin.client";

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

export async function listAdminContactMessagesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<ContactMessageAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<ContactMessageAdmin>>(ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params }, authToken));
}

export async function getAdminContactMessageServer(id: string, authToken: string): Promise<ContactMessageAdmin> {
  return unwrap(await serverApiClient.get<ContactMessageAdmin>(ENDPOINTS.ADMIN.CONTACT_MESSAGE_BY_ID(id), undefined, authToken));
}

export async function updateAdminContactMessageServer(id: string, data: ContactMessageUpdateInput, authToken: string): Promise<ContactMessageAdmin> {
  const m = unwrap(await serverApiClient.patch<ContactMessageAdmin>(ENDPOINTS.ADMIN.CONTACT_MESSAGE_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.CONTACT_MESSAGES);
  return m;
}

export async function deleteAdminContactMessageServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.CONTACT_MESSAGE_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.CONTACT_MESSAGES);
}
