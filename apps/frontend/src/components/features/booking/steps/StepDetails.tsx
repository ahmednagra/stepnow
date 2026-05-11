// src/components/features/booking/steps/StepDetails.tsx
"use client";

import { useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { step3Schema } from "@/schemas/booking.schema";
import {
  LUGGAGE_MAX,
  LUGGAGE_MIN,
  PASSENGER_MAX,
  PASSENGER_MIN,
} from "@/constants/booking-wizard";
import { Textarea } from "@/components/ui";
import { QuantityStepper } from "../QuantityStepper";

interface StepDetailsProps {
  t: TFunction;
  registerValidator?: (validate: () => boolean) => void;
}

type FieldErrors = Partial<
  Record<"passenger_count" | "luggage_count" | "special_requirements", string>
>;

export function StepDetails({ t, registerValidator }: StepDetailsProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<FieldErrors>({});

  const passengerCount = draft.passenger_count ?? PASSENGER_MIN;
  const luggageCount = draft.luggage_count ?? LUGGAGE_MIN;

  function validate(): boolean {
    const result = step3Schema.safeParse({
      passenger_count: passengerCount,
      luggage_count: luggageCount,
      special_requirements: draft.special_requirements ?? "",
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors;
      if (field && !next[field]) next[field] = t(issue.message);
    }
    setErrors(next);
    return false;
  }

  registerValidator?.(validate);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h2 className="font-serif text-section">{t("booking.details.heading")}</h2>
        <p className="max-w-prose text-mute">{t("booking.details.subhead")}</p>
      </header>

      <div className="flex flex-col gap-6 border border-line bg-cream p-6">
        <QuantityStepper
          label={t("booking.details.passengers_label")}
          value={passengerCount}
          onChange={(n) => updateDraft({ passenger_count: n })}
          min={PASSENGER_MIN}
          max={PASSENGER_MAX}
          error={errors.passenger_count}
        />
        <div className="border-t border-line pt-6">
          <QuantityStepper
            label={t("booking.details.luggage_label")}
            value={luggageCount}
            onChange={(n) => updateDraft({ luggage_count: n })}
            min={LUGGAGE_MIN}
            max={LUGGAGE_MAX}
            error={errors.luggage_count}
          />
        </div>
      </div>

      <Textarea
        label={t("booking.details.special_label")}
        placeholder={t("booking.details.special_placeholder")}
        rows={4}
        value={draft.special_requirements ?? ""}
        onChange={(e) => updateDraft({ special_requirements: e.target.value })}
        error={errors.special_requirements}
      />
    </div>
  );
}
