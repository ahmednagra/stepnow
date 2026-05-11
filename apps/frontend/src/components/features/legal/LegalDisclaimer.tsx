// src/components/features/legal/LegalDisclaimer.tsx
import { Info } from "lucide-react";

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
      className={`flex items-start gap-3 border border-line bg-cream px-4 py-3 text-sm text-mute ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />
      <p>
        This English translation is provided for convenience only. The German
        version is the legally binding text.
      </p>
    </aside>
  );
}
