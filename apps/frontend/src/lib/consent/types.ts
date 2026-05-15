// apps/frontend/src/lib/consent/types.ts
// Shared TypeScript types for the DSGVO consent system (cookie shape, category flags, decision state).
export type ConsentCategory = "maps" | "fonts" | "analytics";

export interface ConsentState {
  maps: boolean;
  fonts: boolean;
  analytics: boolean;
}

export interface ConsentCookie {
  v: 1;
  decided: boolean;
  ts: number;
  state: ConsentState;
}

export const CONSENT_COOKIE_NAME = "sn_consent";
export const CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const CONSENT_DEFAULT: ConsentState = { maps: false, fonts: false, analytics: false };
