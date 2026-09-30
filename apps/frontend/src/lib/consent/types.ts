// apps/frontend/src/lib/consent/types.ts
// Shared TypeScript types for the DSGVO consent system (cookie shape, category flags, decision state).
// One category per third-party request the site can actually make — today only the OpenStreetMap
// map (tiles carry the visitor's IP). Fonts are self-hosted and there is no analytics, so neither
// is offered: a banner must name exactly what it gates.
export type ConsentCategory = "maps";

export type ConsentState = Record<ConsentCategory, boolean>;

/** Bump when the category set changes — an older cookie then re-asks instead of being misread. */
export const CONSENT_COOKIE_VERSION = 2;

export interface ConsentCookie {
  v: typeof CONSENT_COOKIE_VERSION;
  decided: boolean;
  ts: number;
  state: ConsentState;
}

export const CONSENT_COOKIE_NAME = "sn_consent";
export const CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const CONSENT_DEFAULT: ConsentState = { maps: false };
export const CONSENT_ALL: ConsentState = { maps: true };
