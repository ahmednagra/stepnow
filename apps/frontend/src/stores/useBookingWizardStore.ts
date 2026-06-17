// src/stores/useBookingWizardStore.ts
// Booking wizard state on raw localStorage (no zustand). Persists across tabs/sessions;
// cleared after a successful submit or explicit reset. Reactivity via createStore.

"use client";

import { createStore } from "@/lib/createStore";
import type { BookingWizardDraft, WizardStep } from "@/types/booking-wizard";
import { WIZARD_STEPS } from "@/types/booking-wizard";

const STORAGE_KEY = "stepnow.booking_wizard.v1";

const INITIAL_DRAFT: BookingWizardDraft = {
  passenger_count: 1,
  luggage_count: 0,
  is_business: false,
};

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

function readStorage(): { step: WizardStep; draft: BookingWizardDraft } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { step?: WizardStep; draft?: Partial<BookingWizardDraft> };
    if (!parsed?.draft) return null;
    return { step: parsed.step ?? "service", draft: { ...INITIAL_DRAFT, ...parsed.draft } };
  } catch {
    return null;
  }
}

function writeStorage(step: WizardStep, draft: BookingWizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, draft }));
  } catch {
    // private mode / blocked storage — non-fatal
  }
}

export const useBookingWizardStore = createStore<BookingWizardState>((set, get) => ({
  step: "service",
  draft: { ...INITIAL_DRAFT },

  setStep: (step) => set({ step }),

  goNext: () => {
    const idx = WIZARD_STEPS.indexOf(get().step);
    if (idx >= 0 && idx < WIZARD_STEPS.length - 1) {
      set({ step: WIZARD_STEPS[idx + 1] });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  goPrevious: () => {
    const idx = WIZARD_STEPS.indexOf(get().step);
    if (idx > 0) {
      set({ step: WIZARD_STEPS[idx - 1] });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  // Merge an external partial (e.g. hero deep-link) without overwriting filled fields.
  hydratePartial: (patch) =>
    set((s) => {
      const merged: BookingWizardDraft = { ...s.draft };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "") continue;
        if ((merged as Record<string, unknown>)[k]) continue;
        (merged as Record<string, unknown>)[k] = v;
      }
      return { draft: merged };
    }),

  reset: () => set({ step: "service", draft: { ...INITIAL_DRAFT } }),
}));

// Client-only: hydrate from localStorage, then mirror every change back to it.
if (typeof window !== "undefined") {
  const stored = readStorage();
  if (stored) useBookingWizardStore.setState(stored);
  useBookingWizardStore.subscribe(() => {
    const s = useBookingWizardStore.getState();
    writeStorage(s.step, s.draft);
  });
}
