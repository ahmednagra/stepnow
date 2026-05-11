// apps/frontend/src/components/ui/Checkbox.tsx
// Phase 3d polish — custom check glyph, refined hover and focus, ReactNode
// label support so consent forms can embed inline links.

"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: ReactNode;
  error?: string;
  required?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, required, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const cbId = id ?? `cb-${reactId}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={cbId} className="group flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={cbId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            className="peer absolute inset-0 cursor-pointer appearance-none opacity-0"
            {...rest}
          />
          <span
            aria-hidden="true"
            className={cn(
              "block h-full w-full border bg-cream transition-all duration-base ease-out-premium",
              "peer-hover:border-line-strong",
              "peer-checked:border-ink peer-checked:bg-ink",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-cream",
              error ? "border-danger" : "border-line",
            )}
            style={{ ["--tw-ring-color" as string]: "rgb(110 84 48 / 0.7)" }}
          />
          <Check
            aria-hidden="true"
            strokeWidth={2.5}
            className="pointer-events-none absolute h-3 w-3 text-cream opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        <span className="text-[14px] leading-relaxed text-ink">
          {label}
          {required && <span className="ml-1 text-gold-deep" aria-hidden="true">*</span>}
        </span>
      </label>
      {error && (
        <p role="alert" className="pl-8 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
