// apps/frontend/src/components/admin/BilingualField.tsx
// Phase 3d polish — DE/EN side-by-side wrapper for admin forms. Maintains the
// "German first" convention from design-direction.md §11.5.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface BilingualFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  de: ReactNode;
  en: ReactNode;
  className?: string;
}

export function BilingualField({
  label,
  hint,
  required,
  de,
  en,
  className,
}: BilingualFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-medium tracking-tight text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Deutsch
          </span>
          {de}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            English
          </span>
          {en}
        </div>
      </div>
      {hint && <p className="text-[11.5px] text-slate-500">{hint}</p>}
    </div>
  );
}
