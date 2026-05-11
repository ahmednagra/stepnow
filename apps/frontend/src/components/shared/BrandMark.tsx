// src/components/shared/BrandMark.tsx
import { cn } from "@/utils/cn";

interface BrandMarkProps {
  /** Size in pixels. Default 28. */
  size?: number;
  /** Tone — adapts to dark vs light background. */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Minimal "SN" monogram in a square. Pure SVG so it scales crisply at any size.
 * Designed to sit alongside the wordmark in the header without overpowering it.
 *
 * Visual: a thin-stroked square frame with an "SN" inside in geometric type.
 */
export function BrandMark({ size = 28, tone = "dark", className }: BrandMarkProps) {
  const stroke = tone === "dark" ? "currentColor" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="StepNow"
      className={cn("shrink-0", className)}
    >
      {/* Square frame */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        stroke={stroke}
        strokeWidth="1.25"
      />
      {/* SN monogram */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="14"
        fontWeight="500"
        fill={stroke}
        letterSpacing="-0.5"
      >
        SN
      </text>
    </svg>
  );
}
