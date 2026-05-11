// apps/frontend/src/components/admin/ConfirmDialog.tsx
// Phase 3d polish — addresses audit M-4 (two-step destructive confirmation).
//   • For destructive actions (`tone="danger"`), a typed-name input is required
//     to enable the confirm button. Naeem must type the resource name.
//   • Visual: tight modal with ink/cream palette so it matches the admin
//     palette rather than introducing a new red panel.

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** When tone is 'danger' and `requireTypeToConfirm` is set, the user must
   *  type this string exactly into the input to enable Confirm. */
  requireTypeToConfirm?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  requireTypeToConfirm = null,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  // Reset typed value whenever the dialog opens.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const isDanger = tone === "danger";
  const matches = requireTypeToConfirm
    ? typed.trim().toLowerCase() === requireTypeToConfirm.trim().toLowerCase()
    : true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative w-full max-w-md border border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2
            id="confirm-title"
            className="text-[14px] font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            disabled={isLoading}
            className="text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-5 text-[13px] text-slate-700">
          {description}
          {requireTypeToConfirm && (
            <div className="border-t border-slate-200 pt-4">
              <label
                htmlFor="confirm-type"
                className="block text-[12px] font-medium text-slate-700"
              >
                Type{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                  {requireTypeToConfirm}
                </code>{" "}
                to confirm
              </label>
              <input
                id="confirm-type"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="mt-2 h-9 w-full border border-slate-300 px-3 text-[13px] text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-9 border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !matches}
            className={cn(
              "h-9 px-4 text-[12.5px] font-medium text-white transition-colors disabled:opacity-50",
              isDanger
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-slate-900 hover:bg-slate-800",
            )}
          >
            {isLoading ? "…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
