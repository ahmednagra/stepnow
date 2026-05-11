// apps/frontend/src/components/shared/Logo.tsx
// Phase 3d polish — combined brand mark + wordmark. Used in Header and Footer.

import { BrandMark } from "./BrandMark";
import { cn } from "@/utils/cn";

interface LogoProps {
  height?: number;
  /** Adds 'priority' hint to the mark — usually true in Header. */
  priority?: boolean;
  className?: string;
  tone?: "dark" | "light";
}

export function Logo({ height = 36, className, tone = "dark" }: LogoProps) {
  const markSize = Math.round(height * 0.85);
  const wordmarkSize = Math.round(height * 0.32);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={markSize} tone={tone} />
      <span
        className={cn(
          "font-sans font-semibold uppercase tracking-[0.22em]",
          tone === "dark" ? "text-ink" : "text-cream",
        )}
        style={{ fontSize: `${wordmarkSize}px` }}
      >
        StepNow
      </span>
    </span>
  );
}
