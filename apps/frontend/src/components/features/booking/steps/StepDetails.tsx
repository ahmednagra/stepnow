// apps/frontend/src/components/features/booking/steps/StepDetails.tsx
// Phase 3d polish — refined counter steppers, optional textarea with char counter.

"use client";

import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import {
  LUGGAGE_MAX,
  LUGGAGE_MIN,
  PASSENGER_MAX,
  PASSENGER_MIN,
} from "@/constants/booking-wizard";
import { Textarea } from "@/components/ui";
import { pickT } from "@/lib/i18n/pick";

interface StepDetailsProps {
  t: TFunction;
  registerValidator: (fn: () => boolean) => void;
}

export function StepDetails({ t, registerValidator }: StepDetailsProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);

  useEffect(() => {
    registerValidator(() => true); 
  }, [registerValidator]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">{t("booking.details.heading")}</h2>
        <p className="mt-2 text-mute">{t("booking.details.subhead")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Counter
          label={pickT(t, "booking.details.passengers_label", "Fahrgäste")}
          min={PASSENGER_MIN}
          max={PASSENGER_MAX}
          value={draft.passenger_count ?? 1}
          onChange={(n) => updateDraft({ passenger_count: n })}
        />
        <Counter
          label={pickT(t, "booking.details.luggage_label", "Gepäckstücke")}
          min={LUGGAGE_MIN}
          max={LUGGAGE_MAX}
          value={draft.luggage_count ?? 0}
          onChange={(n) => updateDraft({ luggage_count: n })}
        />
      </div>

      <Textarea
        label={pickT(t, "booking.details.notes_label", "Besondere Hinweise (optional)")}
        rows={5}
        showCounter
        maxChars={500}
        value={draft.special_requirements ?? ""}
        onChange={(e) => updateDraft({ special_requirements: e.target.value })}
      />
    </div>
  );
}

function Counter({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium tracking-tight text-ink">{label}</span>
      <div className="flex items-center border border-line bg-cream">
        <button
          type="button"
          onClick={() => canDec && onChange(value - 1)}
          aria-label="Decrease"
          disabled={!canDec}
          className="inline-flex h-11 w-11 items-center justify-center text-mute transition-colors hover:text-ink disabled:opacity-30"
        >
          <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <span className="flex-1 text-center font-serif text-xl tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => canInc && onChange(value + 1)}
          aria-label="Increase"
          disabled={!canInc}
          className="inline-flex h-11 w-11 items-center justify-center text-mute transition-colors hover:text-ink disabled:opacity-30"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
