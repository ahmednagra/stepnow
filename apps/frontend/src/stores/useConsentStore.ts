// apps/frontend/src/stores/useConsentStore.ts
// Zustand store for consent state with per-category selectors so a flag change re-renders only its consumers.
"use client";
import { create } from "zustand";
import { buildCookie, readConsentCookie, writeConsentCookie } from "@/lib/consent/cookie";
import { CONSENT_DEFAULT, type ConsentState } from "@/lib/consent/types";

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

export const useConsentStore = create<ConsentStore>((set) => ({
  decided: false,
  state: CONSENT_DEFAULT,
  hydrated: false,
  hydrate: () => {
    const c = readConsentCookie();
    set({ hydrated: true, decided: c?.decided ?? false, state: c?.state ?? CONSENT_DEFAULT });
  },
  acceptAll: () => {
    const next = { maps: true, fonts: true, analytics: true };
    writeConsentCookie(buildCookie(next, true));
    set({ decided: true, state: next });
  },
  rejectAll: () => {
    writeConsentCookie(buildCookie(CONSENT_DEFAULT, true));
    set({ decided: true, state: CONSENT_DEFAULT });
  },
  save: (partial) => {
    let merged: ConsentState = CONSENT_DEFAULT;
    set((prev) => {
      merged = { ...prev.state, ...partial };
      return { decided: true, state: merged };
    });
    writeConsentCookie(buildCookie(merged, true));
  },
  reopen: () => set({ decided: false }),
}));

export const useMapsConsent = () => useConsentStore((s) => s.state.maps);
export const useFontsConsent = () => useConsentStore((s) => s.state.fonts);
export const useAnalyticsConsent = () => useConsentStore((s) => s.state.analytics);
export const useConsentDecided = () => useConsentStore((s) => s.decided);
export const useConsentHydrated = () => useConsentStore((s) => s.hydrated);
