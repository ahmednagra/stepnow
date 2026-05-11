// src/components/ui/RadioGroup.tsx
"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface RadioOption<V extends string = string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<V extends string = string> {
  name: string;
  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;
  options: ReadonlyArray<RadioOption<V>>;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

function RadioGroupInner<V extends string = string>(
  {
    name,
    value,
    defaultValue,
    onChange,
    options,
    label,
    hint,
    error,
    required,
    className,
  }: RadioGroupProps<V>,
) {
  const reactId = useId();
  const errorId = error ? `${reactId}-error` : undefined;
  const hintId = hint ? `${reactId}-hint` : undefined;

  return (
    <fieldset
      className={cn("flex flex-col gap-2", className)}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
    >
      {label && (
        <legend className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-1 text-gold-dark" aria-hidden="true">*</span>}
        </legend>
      )}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 border border-line bg-cream px-4 py-3 transition-colors duration-base",
              "hover:border-ink",
              opt.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value || undefined}
              defaultChecked={defaultValue === opt.value || undefined}
              disabled={opt.disabled}
              onChange={(e) => onChange?.(e.target.value as V)}
              className="mt-1 h-4 w-4 cursor-pointer accent-gold"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">{opt.label}</span>
              {opt.description && (
                <span className="text-xs text-mute">{opt.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// forwardRef wrapper preserving the generic
export const RadioGroup = forwardRef(RadioGroupInner) as <V extends string = string>(
  props: RadioGroupProps<V>,
) => ReturnType<typeof RadioGroupInner>;
