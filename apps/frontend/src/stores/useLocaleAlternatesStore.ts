// apps/frontend/src/stores/useLocaleAlternatesStore.ts
"use client";

import { create } from "zustand";

interface LocaleAlternatesState {
  /**
   * Per-path alternate-URL map. Keys are full pathnames including any
   * locale prefix (e.g. "/dienstleistungen/flughafentransfer" or
   * "/en/services/airport-transfer"). Values are the equivalent pathname
   * in the other locale.
   */
  slugMap: Record<string, string>;
  /** Replace the slug map. Called by <SlugMapBridge> on mount. */
  setSlugMap: (map: Record<string, string>) => void;
  /** Clear the slug map. Called by <SlugMapBridge> on unmount / route change. */
  clearSlugMap: () => void;
}

export const useLocaleAlternatesStore = create<LocaleAlternatesState>((set) => ({
  slugMap: {},
  setSlugMap: (map) => set({ slugMap: map }),
  clearSlugMap: () => set({ slugMap: {} }),
}));

/** Convenience selector — returns the current slug map (empty if none set). */
export function useSlugMap(): Record<string, string> {
  return useLocaleAlternatesStore((s) => s.slugMap);
}