// apps/frontend/src/hooks/useMobileNav.ts
// Tiny global pub/sub so the topbar hamburger can open the sidebar drawer
// regardless of where it lives in the tree. Mirrors useCommandPalette.

import { create } from "zustand";

interface MobileNavState {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}

export const useMobileNav = create<MobileNavState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
}));

export function openMobileNav() {
  useMobileNav.getState().setOpen(true);
}

export function closeMobileNav() {
  useMobileNav.getState().setOpen(false);
}
