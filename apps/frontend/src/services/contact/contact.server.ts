// src/services/contact/contact.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ContactCreate, ContactSubmitted } from "@/types";

export async function submitContactServer(data: ContactCreate): Promise<ContactSubmitted> {
  const result = await serverApiClient.post<ContactSubmitted>(ENDPOINTS.PUBLIC.CONTACT, data);

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Contact submission failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
