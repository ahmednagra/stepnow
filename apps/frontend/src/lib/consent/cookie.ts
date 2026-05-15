// apps/frontend/src/lib/consent/cookie.ts
// Reads and writes the consent cookie on the browser; safe on server (no-ops).
import { CONSENT_COOKIE_MAX_AGE_SECONDS, CONSENT_COOKIE_NAME, CONSENT_DEFAULT, type ConsentCookie } from "./types";

export function readConsentCookie(): ConsentCookie | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));
    const parsed = JSON.parse(raw) as ConsentCookie;
    if (parsed?.v !== 1 || typeof parsed.decided !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsentCookie(cookie: ConsentCookie): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(cookie));
  const parts = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${CONSENT_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];
  if (typeof window !== "undefined" && window.location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function buildCookie(state: Partial<ConsentCookie["state"]>, decided: boolean): ConsentCookie {
  return { v: 1, decided, ts: Date.now(), state: { ...CONSENT_DEFAULT, ...state } };
}
