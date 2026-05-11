// src/components/features/booking/WizardProgress.tsx
"use client";

import type { TFunction } from "@/lib/i18n/t";
import type { WizardStep } from "@/types/booking-wizard";
import { WIZARD_STEPS } from "@/types/booking-wizard";
import { STEP_KEYS } from "@/constants/booking-wizard";
import { cn } from "@/utils/cn";

interface WizardProgressProps {
  t: TFunction;
  currentStep: WizardStep;
}

export function WizardProgress({ t, currentStep }: WizardProgressProps) {
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);
  const total = WIZARD_STEPS.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="label-eyebrow" aria-live="polite">
        {t("booking.progress.step_of", { current: currentIdx + 1, total })}
      </p>
      <ol className="flex items-center gap-2" role="list">
        {STEP_KEYS.map((s, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li
              key={s.key}
              className="flex flex-1 items-center gap-2"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "h-1 w-full transition-colors duration-base",
                  isPast || isCurrent ? "bg-ink" : "bg-line",
                )}
              />
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[11px] uppercase tracking-[0.16em] md:inline",
                  isCurrent ? "text-ink" : isPast ? "text-mute" : "text-mute/60",
                )}
              >
                {t(s.label)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
