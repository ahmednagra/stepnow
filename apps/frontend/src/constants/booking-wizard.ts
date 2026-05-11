// src/constants/booking-wizard.ts
import type { WizardStep } from "@/types/booking-wizard";

export const PASSENGER_MIN = 1;
export const PASSENGER_MAX = 8;
export const LUGGAGE_MIN = 0;
export const LUGGAGE_MAX = 12;

/**
 * Minimum lead time for a booking, in minutes. The wizard rejects datetimes
 * earlier than (now + this) — Naeem needs lead time to confirm the vehicle.
 * Backend may enforce its own minimum; this is just UX.
 */
export const MIN_LEAD_TIME_MINUTES = 60;

/**
 * Maximum advance booking horizon. Bookings further than this are rejected
 * client-side to avoid stale unfulfillable requests in the system.
 */
export const MAX_ADVANCE_DAYS = 180;

/** Ordered step keys for display and progress calculations. */
export const STEP_KEYS: { key: WizardStep; label: string }[] = [
  { key: "service", label: "booking.step.service" },
  { key: "route", label: "booking.step.route" },
  { key: "details", label: "booking.step.details" },
  { key: "contact", label: "booking.step.contact" },
  { key: "review", label: "booking.step.review" },
];
