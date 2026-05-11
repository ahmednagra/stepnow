// src/services/contact/contact.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { ContactCreate, ContactSubmitted } from "@/types";

export async function submitContact(data: ContactCreate): Promise<ContactSubmitted> {
  return nextjsApiClient.post<ContactSubmitted>("/public/contact", data);
}
