// src/stores/useBookingWizardStore.ts
// Single Zustand store for the booking wizard. Persists to sessionStorage so
// state survives refresh within the same tab. Cleared after successful submit
// or when the user explicitly resets.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BookingWizardDraft, WizardStep } from "@/types/booking-wizard";
import { WIZARD_STEPS } from "@/types/booking-wizard";

const STORAGE_KEY = "stepnow.booking_wizard.v1";

interface BookingWizardState {
  step: WizardStep;
  draft: BookingWizardDraft;
  setStep: (step: WizardStep) => void;
  goNext: () => void;
  goPrevious: () => void;
  updateDraft: (patch: Partial<BookingWizardDraft>) => void;
  hydratePartial: (patch: Partial<BookingWizardDraft>) => void;
  reset: () => void;
}

const INITIAL_DRAFT: BookingWizardDraft = {
  passenger_count: 1,
  luggage_count: 0,
  is_business: false,
};

function safeStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // Sanity-test sessionStorage access (some iframes/private modes block it)
    window.sessionStorage.getItem("__sn_probe__");
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export const useBookingWizardStore = create<BookingWizardState>()(
  persist(
    (set, get) => ({
      step: "service",
      draft: { ...INITIAL_DRAFT },

      setStep: (step) => set({ step }),

      goNext: () => {
        const current = get().step;
        const idx = WIZARD_STEPS.indexOf(current);
        if (idx >= 0 && idx < WIZARD_STEPS.length - 1) {
          set({ step: WIZARD_STEPS[idx + 1] });
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },

      goPrevious: () => {
        const current = get().step;
        const idx = WIZARD_STEPS.indexOf(current);
        if (idx > 0) {
          set({ step: WIZARD_STEPS[idx - 1] });
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },

      updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

      /**
       * Merge an external partial (e.g., from the hero widget's deep link)
       * into the draft without overwriting existing values. Used once on
       * wizard mount; later edits use updateDraft.
       */
      hydratePartial: (patch) =>
        set((state) => {
          const merged: BookingWizardDraft = { ...state.draft };
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === "") continue;
            // Don't overwrite a field the user has already filled
            if ((merged as Record<string, unknown>)[k]) continue;
            (merged as Record<string, unknown>)[k] = v;
          }
          return { draft: merged };
        }),

      reset: () => set({ step: "service", draft: { ...INITIAL_DRAFT } }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage() ?? noopStorage),
      // Only persist the fields we need; never accidentally serialize functions
      partialize: (state) => ({ step: state.step, draft: state.draft }),
      version: 1,
    },
  ),
);

/** Stub storage for SSR / blocked-storage environments. */
const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};
