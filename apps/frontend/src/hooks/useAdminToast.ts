// src/hooks/useAdminToast.ts
"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
}

interface ToastStore {
  toasts: ToastMessage[];
  push: (tone: ToastTone, title: string, body?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useAdminToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (tone, title, body) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, tone, title, body }] }));
    // Auto-dismiss after 4 seconds for success/info, 8 for error.
    const ttl = tone === "error" ? 8000 : 4000;
    if (typeof window !== "undefined") {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, ttl);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
