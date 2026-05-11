// apps/frontend/src/components/ui/RadioGroup.tsx
// Phase 3d polish — refined option pills with hairline dividers.

"use client";

import { useId, type ChangeEvent } from "react";
import { cn } from "@/utils/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (next: string) => void;
  className?: string;
}

export function RadioGroup({
  label,
  hint,
  error,
  required,
  options,
  value,
  defaultValue,
  name,
  onChange,
  className,
}: RadioGroupProps) {
  const reactId = useId();
  const groupName = name ?? `radio-${reactId}`;
  const hintId = hint ? `${groupName}-hint` : undefined;
  const errorId = error ? `${groupName}-error` : undefined;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
  }

  return (
    <fieldset
      className={cn("flex flex-col gap-3", className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
    >
      {label && (
        <legend className="text-[13px] font-medium tracking-tight text-ink">
          {label}
          {required && <span className="ml-1 text-gold-deep" aria-hidden="true">*</span>}
        </legend>
      )}
      <ul className="flex flex-col gap-px bg-line">
        {options.map((opt) => {
          const radioId = `${groupName}-${opt.value}`;
          return (
            <li key={opt.value} className="bg-cream">
              <label
                htmlFor={radioId}
                className="flex cursor-pointer items-start gap-4 p-4 transition-colors duration-base hover:bg-paper"
              >
                <span className="relative mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    id={radioId}
                    type="radio"
                    name={groupName}
                    value={opt.value}
                    checked={value !== undefined ? value === opt.value : undefined}
                    defaultChecked={
                      value === undefined && defaultValue === opt.value ? true : undefined
                    }
                    onChange={handleChange}
                    className="peer absolute inset-0 cursor-pointer appearance-none opacity-0"
                  />
                  <span
                    aria-hidden="true"
                    className="block h-full w-full rounded-full border border-line bg-cream transition-all peer-hover:border-line-strong peer-checked:border-ink"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute h-2 w-2 rounded-full bg-ink opacity-0 transition-opacity peer-checked:opacity-100"
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-ink">{opt.label}</span>
                  {opt.description && (
                    <span className="mt-1 block text-[13px] text-mute">{opt.description}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
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
    </fieldset>
  );
}
