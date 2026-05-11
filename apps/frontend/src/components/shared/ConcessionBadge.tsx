// apps/frontend/src/components/shared/ConcessionBadge.tsx
// New component — addresses audit H-1 (concession badge above-the-fold).
// Renders a small, gold-eyebrow pill that fits inside the hero CTA row and
// communicates PBefG licensure. Hidden cleanly when no concession_number is
// set (pre-launch state).

import type { SettingsPublic } from "@/types";
import { cn } from "@/utils/cn";

interface ConcessionBadgeProps {
  settings: SettingsPublic;
  /** Tone: 'dark' for hero / final-CTA (cream text), 'light' for cream surfaces. */
  tone?: "dark" | "light";
  className?: string;
}

export function ConcessionBadge({ settings, tone = "dark", className }: ConcessionBadgeProps) {
  if (!settings.concession_number) return null;

  const isDark = tone === "dark";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5",
        "text-[10px] font-semibold uppercase tracking-[0.22em]",
        isDark
          ? "border-gold/40 text-gold"
          : "border-gold-deep/30 text-gold-deep",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-1 w-1 rounded-full",
          isDark ? "bg-gold" : "bg-gold-deep",
        )}
      />
      <span>§ 49 PBefG · {settings.concession_number}</span>
    </span>
  );
}
