// apps/frontend/src/hooks/useMobileNav.ts
import { create } from "zustand";

interface MobileNavState {
  open: boolean;            // mobile drawer
  collapsed: boolean;       // desktop rail collapsed
  toggle: () => void;
  setOpen: (v: boolean) => void;
  toggleCollapsed: () => void;
}

const KEY = "admin.sidebar.collapsed";
const initialCollapsed =
  typeof window !== "undefined" && localStorage.getItem(KEY) === "1";

export const useMobileNav = create<MobileNavState>((set) => ({
  open: false,
  collapsed: initialCollapsed,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
  toggleCollapsed: () =>
    set((s) => {
      const next = !s.collapsed;
      if (typeof window !== "undefined")
        localStorage.setItem(KEY, next ? "1" : "0");
      return { collapsed: next };
    }),
}));

export function openMobileNav() { useMobileNav.getState().setOpen(true); }
export function closeMobileNav() { useMobileNav.getState().setOpen(false); }
