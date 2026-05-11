// src/components/admin/BilingualField.tsx
import type { ReactNode } from "react";

interface BilingualFieldProps {
  label: string;
  /** Help text below the row. */
  helper?: string;
  required?: boolean;
  /** Left side (DE) input. */
  de: ReactNode;
  /** Right side (EN) input. */
  en: ReactNode;
  /** Per-locale error messages. */
  errorDe?: string;
  errorEn?: string;
}

/**
 * Wraps two same-purpose inputs as a side-by-side DE | EN field row.
 * Lets editors see both translations at once. Each input keeps its own
 * error state below the input. The shared label sits above both columns.
 */
export function BilingualField({
  label,
  helper,
  required,
  de,
  en,
  errorDe,
  errorEn,
}: BilingualFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">DE · EN</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          {de}
          {errorDe && (
            <p role="alert" className="text-[11px] text-red-600">
              {errorDe}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {en}
          {errorEn && (
            <p role="alert" className="text-[11px] text-red-600">
              {errorEn}
            </p>
          )}
        </div>
      </div>
      {helper && !errorDe && !errorEn && (
        <p className="text-[11px] text-slate-500">{helper}</p>
      )}
    </div>
  );
}
