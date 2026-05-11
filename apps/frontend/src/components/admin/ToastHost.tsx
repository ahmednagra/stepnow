// src/components/admin/ToastHost.tsx
"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useAdminToast, type ToastTone } from "@/hooks/useAdminToast";
import { cn } from "@/utils/cn";

const TONE_CONFIG: Record<ToastTone, { icon: typeof CheckCircle2; bar: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bar: "border-l-emerald-500", iconColor: "text-emerald-500" },
  error: { icon: AlertCircle, bar: "border-l-red-500", iconColor: "text-red-500" },
  info: { icon: Info, bar: "border-l-blue-500", iconColor: "text-blue-500" },
};

export function ToastHost() {
  const toasts = useAdminToast((s) => s.toasts);
  const dismiss = useAdminToast((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => {
        const cfg = TONE_CONFIG[toast.tone];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-80 items-start gap-3 border border-l-4 bg-white p-3 shadow-md",
              cfg.bar,
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconColor)} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{toast.title}</p>
              {toast.body && (
                <p className="mt-0.5 text-xs text-slate-600">{toast.body}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="text-slate-400 transition-colors hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
