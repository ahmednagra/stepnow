// src/components/features/legal/LegalDisclaimer.tsx
import { Info } from "lucide-react";
import { cn } from "@/utils/cn";

interface LegalDisclaimerProps {
  className?: string;
}

/**
 * Shown only on EN legal pages. Communicates that the German version is the
 * legally binding one — per website-outline.md §11 and standard German
 * practice for translated Impressum/Datenschutz/AGB.
 */
export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
  return (
    <aside
      role="note"
      className={cn(
        "flex items-start gap-3 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-accent-soft)] px-4 py-3.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]",
        className,
      )}
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-primary)]"
        aria-hidden="true"
      />
      <p>
        This English translation is provided for convenience only. The German
        version is the legally binding text.
      </p>
    </aside>
  );
}
