// apps/frontend/src/components/shared/PhoneCTA.tsx
// Phase 3d polish — refined tone variants for dark and light surfaces.

import Link from "next/link";
import { Phone } from "lucide-react";
import { toTelHref } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface PhoneCTAProps {
  phone: string;
  label?: string;
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "text-[12px]",
  md: "text-[14px]",
  lg: "text-[16px]",
};

export function PhoneCTA({
  phone,
  label,
  tone = "light",
  size = "md",
  className,
}: PhoneCTAProps) {
  return (
    <Link
      href={toTelHref(phone)}
      className={cn(
        "inline-flex items-center gap-2 font-medium tracking-tight transition-colors duration-base",
        SIZES[size],
        tone === "dark"
          ? "text-cream hover:text-gold"
          : "text-ink hover:text-gold-deep",
        className,
      )}
    >
      <Phone className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
      {label ? (
        <span>{label}</span>
      ) : (
        <span className="tabular-nums">{phone}</span>
      )}
    </Link>
  );
}
