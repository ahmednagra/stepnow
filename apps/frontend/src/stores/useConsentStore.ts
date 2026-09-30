// apps/frontend/src/stores/useConsentStore.ts
// Consent state (no zustand). Persistence stays the consent cookie — it must be
// server-readable, so it is NOT moved to localStorage. Reactivity via createStore;
// per-category selectors re-render only their consumers.
"use client";
import { createStore } from "@/lib/createStore";
import { buildCookie, readConsentCookie, writeConsentCookie } from "@/lib/consent/cookie";
import { CONSENT_ALL, CONSENT_DEFAULT, type ConsentState } from "@/lib/consent/types";

interface ConsentStore {
  decided: boolean;
  state: ConsentState;
  hydrated: boolean;
  hydrate: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (partial: Partial<ConsentState>) => void;
  reopen: () => void;
}

export const useConsentStore = createStore<ConsentStore>((set, get) => ({
  decided: false,
  state: CONSENT_DEFAULT,
  hydrated: false,
  hydrate: () => {
    const c = readConsentCookie();
    set({ hydrated: true, decided: c?.decided ?? false, state: c?.state ?? CONSENT_DEFAULT });
  },
  acceptAll: () => {
    writeConsentCookie(buildCookie(CONSENT_ALL, true));
    set({ decided: true, state: CONSENT_ALL });
  },
  rejectAll: () => {
    writeConsentCookie(buildCookie(CONSENT_DEFAULT, true));
    set({ decided: true, state: CONSENT_DEFAULT });
  },
  save: (partial) => {
    const merged: ConsentState = { ...get().state, ...partial };
    writeConsentCookie(buildCookie(merged, true));
    set({ decided: true, state: merged });
  },
  reopen: () => set({ decided: false }),
}));

export const useMapsConsent = () => useConsentStore((s) => s.state.maps);
export const useConsentDecided = () => useConsentStore((s) => s.decided);
export const useConsentHydrated = () => useConsentStore((s) => s.hydrated);
