// src/components/ui/Checkbox.tsx
"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `checkbox-${reactId}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={inputId} className="inline-flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-line bg-cream peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            {...rest}
          />
          <Check
            aria-hidden="true"
            className="pointer-events-none h-3.5 w-3.5 text-ink opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="text-sm leading-relaxed text-ink">{label}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="ml-8 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
