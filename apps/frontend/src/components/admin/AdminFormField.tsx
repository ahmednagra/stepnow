// src/components/admin/AdminFormField.tsx
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminFormFieldProps {
  label: string;
  htmlFor?: string;
  /** Right-aligned helper text in the label row (e.g. "optional"). */
  hint?: string;
  /** Below-input helper text. */
  helper?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Labeled wrapper for input controls in admin forms. The child is the actual
 * input element. Keeps consistent vertical rhythm and error/helper styling.
 *
 * Usage:
 *   <AdminFormField label="Business name" htmlFor="biz" required>
 *     <input id="biz" className="admin-input" ... />
 *   </AdminFormField>
 */
export function AdminFormField({
  label,
  htmlFor,
  hint,
  helper,
  error,
  required,
  children,
  className,
}: AdminFormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[12px] font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-[11px] text-red-600">
          {error}
        </p>
      ) : helper ? (
        <p className="text-[11px] text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

/**
 * Reusable input class for admin forms. Use directly on <input> elements
 * inside AdminFormField. Designed for density: 32px tall, 13px text.
 */
export const adminInputClass =
  "w-full border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500";

export const adminTextareaClass =
  "w-full border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500";
