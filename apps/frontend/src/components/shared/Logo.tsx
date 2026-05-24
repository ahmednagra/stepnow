import Image from "next/image";
import { cn } from "@/utils/cn";

interface LogoProps {
  height?: number;
  /** Adds 'priority' hint to the mark — usually true in Header. */
  priority?: boolean;
  className?: string;
  tone?: "dark" | "light";
  variant?: "full" | "mark";
}

export function Logo({
  height = 36,
  priority = false,
  className,
  tone = "dark",
  variant = "full",
}: LogoProps) {
  const isMark = variant === "mark";
  const width = isMark ? height : Math.round(height * (3613 / 1012));
  return (
    <span
      className={cn(
        "inline-flex items-center",
        tone === "light" && "bg-[var(--color-bg-page)]/10 rounded-[4px] p-1.5",
        className,
      )}
    >
      <Image
        src={isMark ? "/brand/icon.webp" : "/logo.png"}
        alt="StepNow"
        width={width}
        height={height}
        priority={priority}
      />
    </span>
  );
}
