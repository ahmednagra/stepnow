// apps/frontend/src/components/ui/Badge.tsx
// Phase 3d polish — refined badge primitive used in admin tables and public
// service tags.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type BadgeTone =
  | "neutral"
  | "gold"
  | "ink"
  | "success"
  | "warn"
  | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-paper text-mute-strong border-line",
  gold: "bg-gold/10 text-gold-deep border-gold/30",
  ink: "bg-ink text-cream border-ink",
  success: "bg-success/10 text-success border-success/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
