// apps/frontend/src/components/admin/ToastHost.tsx
// Phase 3d polish — addresses audit M-4 (Undo for destructive actions).
//   • Toast queue with up to 3 visible at once.
//   • Each toast may include an action (e.g. "Undo") that fires a callback
//     and dismisses the toast.
//   • Auto-dismiss after 6s (10s when an action is attached so the user has
//     time to click Undo).

"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

type ToastTone = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

interface ToastEntry {
  id: number;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

// Module-level subscriber so any component can push toasts.
const subscribers: Array<(t: ToastEntry) => void> = [];
let nextId = 1;

export function pushToast(toast: Omit<ToastEntry, "id">) {
  const entry: ToastEntry = { id: nextId++, ...toast };
  for (const fn of subscribers) fn(entry);
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    function push(t: ToastEntry) {
      setToasts((cur) => [...cur, t].slice(-3));
      const delay = t.action ? 10000 : 6000;
      window.setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, delay);
    }
    subscribers.push(push);
    return () => {
      const idx = subscribers.indexOf(push);
      if (idx !== -1) subscribers.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 border bg-white px-4 py-3 shadow-lg",
            t.tone === "success" && "border-emerald-300",
            t.tone === "error" && "border-rose-300",
            t.tone === "info" && "border-slate-300",
          )}
          style={{ minWidth: 280, maxWidth: 420 }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center",
              t.tone === "success" && "text-emerald-700",
              t.tone === "error" && "text-rose-700",
              t.tone === "info" && "text-slate-700",
            )}
          >
            {t.tone === "success" ? (
              <Check className="h-4 w-4" strokeWidth={2} />
            ) : t.tone === "error" ? (
              <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Info className="h-4 w-4" strokeWidth={1.5} />
            )}
          </span>
          <p className="flex-1 text-[13px] leading-snug text-slate-800">{t.message}</p>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick();
                setToasts((cur) => cur.filter((x) => x.id !== t.id));
              }}
              className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-700 transition-colors hover:text-slate-900"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
            className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
