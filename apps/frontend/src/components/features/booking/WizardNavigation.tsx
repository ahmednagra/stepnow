// src/components/features/booking/WizardNavigation.tsx
"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Button } from "@/components/ui";

interface WizardNavigationProps {
  t: TFunction;
  /** Hide the back button on step 1. */
  canGoBack: boolean;
  /** Hide the forward button on the final step (review submits via its own button). */
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
    <div className="flex items-center justify-between gap-4 border-t border-line pt-8">
      {canGoBack ? (
        <Button
          variant="ghost"
          onClick={onBack}
          leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          {t("common.back")}
        </Button>
      ) : (
        <span />
      )}
      {showContinue && (
        <Button
          variant="primary"
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
