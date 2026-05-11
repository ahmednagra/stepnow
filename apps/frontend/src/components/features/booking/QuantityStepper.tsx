// src/components/features/booking/QuantityStepper.tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { cn } from "@/utils/cn";

interface QuantityStepperProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  error?: string;
  hint?: string;
}

/**
 * +/- counter input. More premium UX than a number input for small integer
 * selections (passengers, luggage). Buttons are 44px square (good for touch),
 * value is centered in the same vertical row.
 */
export function QuantityStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  error,
  hint,
}: QuantityStepperProps) {
  const id = useId();
  const decId = `${id}-dec`;
  const incId = `${id}-inc`;
  const valueId = `${id}-val`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;

  function dec() {
    onChange(Math.max(min, value - 1));
  }
  function inc() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span id={`${id}-label`} className="text-sm font-medium text-ink">
          {label}
        </span>
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "inline-flex items-center border",
            error ? "border-red-600" : "border-line",
          )}
        >
          <button
            id={decId}
            type="button"
            onClick={dec}
            disabled={value <= min}
            aria-label={`${label} −`}
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-base hover:bg-line/30 disabled:cursor-not-allowed disabled:text-line"
          >
            <Minus className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
          </button>
          <span
            id={valueId}
            aria-live="polite"
            className="flex h-11 w-12 items-center justify-center border-x border-line bg-cream font-serif text-lg tabular-nums"
          >
            {value}
          </span>
          <button
            id={incId}
            type="button"
            onClick={inc}
            disabled={value >= max}
            aria-label={`${label} +`}
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-base hover:bg-line/30 disabled:cursor-not-allowed disabled:text-line"
          >
            <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
