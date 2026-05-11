// apps/frontend/src/components/features/booking/WizardNavigation.tsx
// Phase 3d polish — refined wizard nav: back-link feels like a footnote,
// continue button is the visual anchor.

"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Button } from "@/components/ui";

interface WizardNavigationProps {
  t: TFunction;
  canGoBack: boolean;
  showContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export function WizardNavigation({
  t,
  canGoBack,
  showContinue,
  onBack,
  onContinue,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {canGoBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.20em] text-mute transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("common.back")}
        </button>
      ) : (
        <span />
      )}
      {showContinue && (
        <Button
          size="lg"
          onClick={onContinue}
          trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {t("common.continue")}
        </Button>
      )}
    </div>
  );
}
