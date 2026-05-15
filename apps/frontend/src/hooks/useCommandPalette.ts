// apps/frontend/src/hooks/useCommandPalette.ts
// Tiny global pub/sub so the topbar button can open the palette regardless of where it lives.

import { create } from "zustand";

interface PaletteState {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}

export const useCommandPalette = create<PaletteState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
}));

export function openCommandPalette() {
  useCommandPalette.getState().setOpen(true);
}
