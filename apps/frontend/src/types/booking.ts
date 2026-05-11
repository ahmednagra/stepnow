// src/types/booking.ts

export const BOOKING_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface BookingCreate {
  service_id?: string;
  pickup_address: string;
  pickup_postcode?: string;
  pickup_city?: string;
  destination_address: string;
  destination_postcode?: string;
  destination_city?: string;
  requested_datetime: string;
  passenger_count: number;
  luggage_count: number;
  special_requirements?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  is_business: boolean;
  company_name?: string;
  company_vatid?: string;
  language: "de" | "en";
  consent_dsgvo: true;
  /** Honeypot — must be empty. */
  website?: string;
}

export interface BookingSubmitted {
  reference: string;
  status: "new";
  message: string;
}

export interface BookingAdmin {
  id: string;
  reference: string;
  status: BookingStatus;
  service_id: string | null;
  pickup_address: string;
  pickup_postcode: string | null;
  pickup_city: string | null;
  destination_address: string;
  destination_postcode: string | null;
  destination_city: string | null;
  requested_datetime: string;
  passenger_count: number;
  luggage_count: number;
  special_requirements: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  is_business: boolean;
  company_name: string | null;
  company_vatid: string | null;
  language: "de" | "en";
  quoted_price_eur: string | null;
  internal_notes: string | null;
  quoted_at: string | null;
  completed_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
