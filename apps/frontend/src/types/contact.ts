// src/types/contact.ts

export const CONTACT_CATEGORIES = [
  "general",
  "booking",
  "complaint",
  "business",
  "other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface ContactCreate {
  name: string;
  email: string;
  phone?: string;
  subject_category: ContactCategory;
  message: string;
  language: "de" | "en";
  consent_dsgvo: true;
  website?: string; // honeypot
}

export interface ContactSubmitted {
  ok: true;
  message: string;
}

export interface ContactMessageAdmin {
  id: string;
  subject_category: ContactCategory;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  language: "de" | "en";
  is_handled: boolean;
  handled_at: string | null;
  internal_notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
