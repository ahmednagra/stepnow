// src/components/ui/Button.tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant =
  | "primary"      // gold pill on light bg
  | "secondary"   // ink pill (dark on light)
  | "outline"      // bordered, transparent
  | "ghost"        // text-only
  | "inverse";     // white on dark — for hero context
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Variant table:
 * - primary  : gold bg, ink text — primary CTA on light surfaces
 * - inverse  : cream bg, ink text — primary CTA on dark surfaces (hero)
 * - secondary: ink bg, cream text — secondary CTA on light
 * - outline  : transparent bg, current border/text — universal alt
 * - ghost    : transparent, text-only — tertiary nav-like
 *
 * Refinements over the old version:
 * - subtler hover (no abrupt color shift); slight shadow on primary/secondary
 * - active state with translate-y: feel of physical press
 * - longer transitions with premium easing
 * - inverse variant designed specifically for hero buttons (no awkward
 *   `border-cream text-cream hover:bg-cream hover:text-ink` workarounds)
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-ink shadow-sm hover:bg-gold-light hover:shadow-md active:translate-y-px active:shadow-sm disabled:bg-line disabled:text-mute disabled:shadow-none",
  secondary:
    "bg-ink text-cream shadow-sm hover:bg-charcoal hover:shadow-md active:translate-y-px active:shadow-sm disabled:bg-mute disabled:text-line disabled:shadow-none",
  inverse:
    "bg-cream text-ink shadow-sm hover:bg-paper hover:shadow-md active:translate-y-px active:shadow-sm disabled:bg-mute disabled:text-line disabled:shadow-none",
  outline:
    "border border-current text-current hover:bg-current/5 active:translate-y-px disabled:opacity-40 disabled:hover:bg-transparent",
  ghost: "text-current hover:bg-current/5 disabled:text-mute disabled:hover:bg-transparent",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-5 text-[13px]",
  md: "h-11 px-7 text-[14px]",
  lg: "h-[3.25rem] px-9 text-[15px]", // 52px — premium feel
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
        "group inline-flex select-none items-center justify-center gap-2.5 rounded-none font-medium tracking-tight",
        "transition-all duration-base ease-out-premium",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {isLoading ? <Spinner /> : leadingIcon}
      <span className="inline-flex items-center">{children}</span>
      {!isLoading && trailingIcon && (
        <span className="transition-transform duration-base ease-out-premium group-hover:translate-x-0.5">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
    </svg>
  );
}
