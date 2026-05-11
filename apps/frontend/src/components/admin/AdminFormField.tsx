// apps/frontend/src/components/admin/AdminFormField.tsx
// Phase 3d polish — refined admin form field wrapper. Exports the shared
// `adminInputClass` and `adminTextareaClass` strings used throughout admin
// CRUD forms so styling stays consistent.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminFormFieldProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function AdminFormField({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: AdminFormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[12px] font-medium tracking-tight text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11.5px] text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-[11.5px] font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export const adminInputClass = cn(
  "h-9 w-full border border-slate-300 bg-white px-3 text-[13px] text-slate-900",
  "transition-colors duration-150",
  "placeholder:text-slate-400",
  "focus:border-slate-900 focus:outline-none",
);

export const adminTextareaClass = cn(
  "w-full border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900",
  "transition-colors duration-150",
  "placeholder:text-slate-400",
  "focus:border-slate-900 focus:outline-none",
);
