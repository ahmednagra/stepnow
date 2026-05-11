// src/components/shared/PhoneCTA.tsx
"use client";

import { Phone } from "lucide-react";
import { cn } from "@/utils/cn";

interface PhoneCTAProps {
  phone: string;
  label?: string;
  className?: string;
  /** Compact: icon + number on one line. Default: stacked label + number. */
  variant?: "compact" | "stacked";
}

/** Sanitize phone number for `tel:` link — strip spaces, dashes, parentheses. */
function toTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

export function PhoneCTA({ phone, label, className, variant = "compact" }: PhoneCTAProps) {
  if (variant === "stacked") {
    return (
      <a
        href={toTelHref(phone)}
        className={cn("flex flex-col text-ink hover:text-gold-dark", className)}
      >
        {label && <span className="label-eyebrow">{label}</span>}
        <span className="mt-1 font-medium tracking-tight">{phone}</span>
      </a>
    );
  }
  return (
    <a
      href={toTelHref(phone)}
      className={cn(
        "inline-flex items-center gap-2 text-ink hover:text-gold-dark transition-colors duration-base",
        className,
      )}
    >
      <Phone className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{phone}</span>
    </a>
  );
}
