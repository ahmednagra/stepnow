// apps/frontend/src/components/ui/Input.tsx
// Phase 3d polish — refined border, focus animation, nudge on error (audit §11.3).

"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Visually hide the label but keep it accessible to screen readers. */
  hideLabel?: boolean;
  /** Optional leading visual (e.g., icon) — must be sized 16px. */
  leadingAdornment?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, hideLabel, id, className, leadingAdornment, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
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
        {leadingAdornment && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute"
            aria-hidden="true"
          >
            {leadingAdornment}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            "h-11 w-full border bg-cream text-[15px] text-ink",
            "transition-all duration-base ease-out-premium",
            "placeholder:text-mute-soft",
            "hover:border-line-strong",
            "focus:border-gold-deep focus:bg-paper focus:outline-none",
            error ? "border-danger" : "border-line",
            rest.disabled && "cursor-not-allowed bg-line/30 text-mute",
            leadingAdornment ? "pl-10 pr-4" : "px-4",
          )}
          {...rest}
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
