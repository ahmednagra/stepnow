// apps/frontend/src/components/ui/Button.tsx
// Phase 3d polish — softer hover, premium shadow lift on primary/inverse,
// outline variant tuned to look like a chauffeur-service quote line, and
// fully accessible disabled state. Addresses audit §11 (buttons feel mid-tier).

"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant =
  | "primary"   // gold fill on light surfaces (homepage CTAs)
  | "secondary" // ink fill on light surfaces (header CTA, inline)
  | "outline"   // bordered, transparent — current color
  | "ghost"     // text-only, hover bg
  | "inverse";  // cream fill on dark surfaces (hero / final CTA)
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "border border-[color:var(--color-bg-strong)] bg-[var(--color-bg-strong)] text-[var(--color-text-on-strong)] shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
    "before:bg-[var(--color-bg-strong-hover)] before:opacity-100",
    "hover:border-[color:var(--color-bg-strong-hover)] hover:shadow-[0_6px_16px_rgba(15,17,21,0.12)]",
    "active:translate-y-px active:shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
    "disabled:border-[color:var(--color-border-soft)] disabled:bg-[var(--color-border-soft)] disabled:text-[var(--color-text-secondary)] disabled:shadow-none",
  ),
  secondary: cn(
    "border border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-text-on-strong)] shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
    "before:bg-[#1A1A1A]",
    "hover:border-[#1A1A1A] hover:shadow-[0_6px_16px_rgba(15,17,21,0.12)]",
    "active:translate-y-px active:shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
    "disabled:border-[color:var(--color-text-secondary)] disabled:bg-[var(--color-text-secondary)] disabled:text-[var(--color-bg-page)] disabled:shadow-none",
  ),
  inverse: cn(
    "border border-[color:var(--color-bg-page)] bg-[var(--color-bg-page)] text-[var(--color-text-primary)] shadow-[0_2px_8px_rgba(15,23,42,0.10)]",
    "before:bg-[var(--color-bg-surface)]",
    "hover:border-[color:var(--color-bg-surface)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.14)]",
    "active:translate-y-px active:shadow-[0_2px_8px_rgba(15,23,42,0.10)]",
    "disabled:border-[color:var(--color-text-secondary)] disabled:bg-[var(--color-text-secondary)] disabled:text-[var(--color-bg-page)] disabled:shadow-none",
  ),
  outline: cn(
    "border border-current text-current bg-transparent",
    "hover:bg-current/5",
    "active:translate-y-px",
    "disabled:opacity-40 disabled:hover:bg-transparent",
  ),
  ghost: cn(
    "text-current bg-transparent",
    "hover:bg-current/5",
    "disabled:text-mute disabled:hover:bg-transparent",
  ),
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-5 text-[13px]",
  md: "h-11 px-7 text-[14px]",
  lg: "h-[3.25rem] px-9 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        "group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden",
        "rounded-none font-medium tracking-tight",
        "transition-all duration-base ease-out-premium",
        "before:absolute before:inset-0 before:origin-left before:scale-x-0 before:transition-transform before:duration-base before:ease-out-premium",
        "hover:before:scale-x-100",
        "disabled:cursor-not-allowed",
        "disabled:before:scale-x-0",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <span className="relative z-10">
          <Spinner />
        </span>
      ) : (
        <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="transition-transform duration-base ease-out-premium group-hover:-translate-x-0.5"
            >
              {leadingIcon}
            </span>
          )}
          <span>{children}</span>
          {trailingIcon && (
            <span
              aria-hidden="true"
              className="transition-transform duration-base ease-out-premium group-hover:translate-x-0.5"
            >
              {trailingIcon}
            </span>
          )}
        </span>
      )}
    </button>
  );
});

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
