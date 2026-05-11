// src/components/shared/EmptyState.tsx
import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  /** Optional eyebrow label above the title. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Optional CTA at the bottom (button, link, etc). */
  action?: ReactNode;
  /** Tone — dark for use over light bg (default), light for use over ink bg. */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Typographic empty state. Used when an image is missing (no hero photo yet),
 * when a list is empty (no testimonials, no FAQs in a category), or as a
 * placeholder section per design-direction.md §11.3.
 */
export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  tone = "dark",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border px-6 py-16 text-center",
        tone === "dark"
          ? "border-line bg-cream text-ink"
          : "border-cream/15 bg-ink text-cream",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "label-eyebrow",
            tone === "light" && "!text-cream/60",
          )}
        >
          {eyebrow}
        </span>
      )}
      <p className="font-serif text-2xl md:text-3xl">{title}</p>
      {description && (
        <p
          className={cn(
            "max-w-md text-sm",
            tone === "dark" ? "text-mute" : "text-cream/70",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
