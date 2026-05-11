// apps/frontend/src/components/ui/Textarea.tsx
// Phase 3d polish — matches Input refinements; supports optional character counter.

"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  /** When set, displays a `count / max` counter (audit §6.4 contact form). */
  showCounter?: boolean;
  /** Used by the counter when `showCounter` is true; falls back to maxLength. */
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    required,
    hideLabel,
    showCounter,
    maxChars,
    id,
    className,
    rows = 4,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const taId = id ?? `ta-${reactId}`;
  const hintId = hint ? `${taId}-hint` : undefined;
  const errorId = error ? `${taId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  // Best-effort current length (controlled or defaultValue).
  const currentLen =
    typeof value === "string"
      ? value.length
      : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;
  const cap = maxChars ?? rest.maxLength;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={taId}
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
        <textarea
          ref={ref}
          id={taId}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            "w-full border bg-cream px-4 py-3 text-[15px] text-ink",
            "transition-all duration-base ease-out-premium",
            "placeholder:text-mute-soft",
            "hover:border-line-strong",
            "focus:border-gold-deep focus:bg-paper focus:outline-none",
            error ? "border-danger" : "border-line",
            rest.disabled && "cursor-not-allowed bg-line/30 text-mute",
          )}
          {...rest}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
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
        {showCounter && cap !== undefined && (
          <p
            className={cn(
              "text-[11px] tabular-nums text-mute",
              currentLen > cap * 0.9 && "text-gold-dark",
              currentLen >= cap && "text-danger",
            )}
          >
            {currentLen} / {cap}
          </p>
        )}
      </div>
    </div>
  );
});
