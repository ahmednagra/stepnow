// apps/frontend/src/components/features/booking/WizardProgress.tsx
// Phase 3d polish — refined: past steps in ink, current in gold, future in
// line-soft. Step labels visible from md+ with tightened tracking.

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
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep"
        aria-live="polite"
      >
        {t("booking.progress.step_of", { current: currentIdx + 1, total })}
      </p>
      <ol className="flex items-center gap-3" role="list">
        {STEP_KEYS.map((s, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li
              key={s.key}
              className="flex flex-1 flex-col gap-2"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "h-[2px] w-full transition-all duration-base ease-out-premium",
                  isCurrent ? "bg-gold" : isPast ? "bg-ink" : "bg-line-soft",
                )}
              />
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.16em] md:inline",
                  isCurrent
                    ? "text-ink"
                    : isPast
                      ? "text-mute"
                      : "text-mute-soft",
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
