// src/components/ui/Badge.tsx
import { type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "gold";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-line/40 text-ink",
  success: "bg-green-100 text-green-900",
  warning: "bg-yellow-100 text-yellow-900",
  danger: "bg-red-100 text-red-900",
  gold: "bg-gold/15 text-gold-dark",
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
