// src/types/booking-wizard.ts
// Wizard-specific types. The submitted booking shape is in types/booking.ts.

export const WIZARD_STEPS = ["service", "route", "details", "contact", "review"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/**
 * Wizard draft — what's in the Zustand store between steps. All fields are
 * optional during data entry. The final BookingCreate is assembled at submit time
 * from a fully-filled draft.
 */
export interface BookingWizardDraft {
  // Step 1 — service + datetime
  service_id?: string;
  pickup_date?: string;            // YYYY-MM-DD
  pickup_time?: string;            // HH:MM (24h)

  // Step 2 — route
  pickup_address?: string;
  pickup_postcode?: string;
  pickup_city?: string;
  destination_address?: string;
  destination_postcode?: string;
  destination_city?: string;

  // Step 3 — details
  passenger_count?: number;
  luggage_count?: number;
  special_requirements?: string;

  // Step 4 — contact
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  is_business?: boolean;
  company_name?: string;
  company_vatid?: string;

  // Step 5 — review (consent submitted here)
  consent_dsgvo?: boolean;
  // Honeypot — never displayed
  website?: string;
}
