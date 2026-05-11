// apps/frontend/src/components/shared/BrandMark.tsx
// Phase 3d polish — refined geometric mark: a chevron + step motif suggesting
// motion (chauffeur service), drawn at 1.25 stroke for an editorial feel.

interface BrandMarkProps {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
}

export function BrandMark({ size = 24, tone = "dark", className }: BrandMarkProps) {
  const stroke = tone === "dark" ? "#000000" : "#F5F2EC";
  const accent = "#A8865A";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 22 L13 14 L19 20 L27 12"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="27" cy="12" r="2" fill={accent} />
    </svg>
  );
}
