// apps/frontend/src/components/ui/Select.tsx
// Phase 3d polish — refined to match Input.

"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, hideLabel, id, className, children, ...rest },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            "text-[13px] font-medium tracking-tight text-ink",
            hideLabel && "sr-only",
          )}
        >
          {label}
          {required && <span className="ml-1 text-gold-deep" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={cn("relative", error && "animate-nudge")}>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            "h-11 w-full appearance-none border bg-cream px-4 pr-10 text-[15px] text-ink",
            "transition-all duration-base ease-out-premium",
            "hover:border-line-strong",
            "focus:border-gold-deep focus:bg-paper focus:outline-none",
            error ? "border-danger" : "border-line",
            rest.disabled && "cursor-not-allowed bg-line/30 text-mute",
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
