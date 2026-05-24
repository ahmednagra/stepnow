// apps/frontend/src/components/features/booking/steps/StepService.tsx
// Phase 3d polish — refined service-picker card grid + date/time inputs.

"use client";

import { useEffect, useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic } from "@/types";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { MAX_ADVANCE_DAYS, MIN_LEAD_TIME_MINUTES } from "@/constants/booking-wizard";
import { Input } from "@/components/ui";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";

interface StepServiceProps {
  t: TFunction;
  locale: Locale;
  services: ServicePublic[];
  onValidated: () => void;
  registerValidator: (fn: () => boolean) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function dateOffsetStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function StepService({
  t,
  services,
  registerValidator,
}: StepServiceProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<{
    service?: string;
    date?: string;
    time?: string;
  }>({});

  useEffect(() => {
    registerValidator(() => {
      const next: typeof errors = {};
      if (!draft.pickup_date) next.date = t("errors.required");
      if (!draft.pickup_time) next.time = t("errors.required");
      // Lead time check
      if (draft.pickup_date && draft.pickup_time) {
        const requested = new Date(`${draft.pickup_date}T${draft.pickup_time}:00`);
        const minLead = new Date(Date.now() + MIN_LEAD_TIME_MINUTES * 60 * 1000);
        if (requested < minLead) {
          next.time = pickT(
            t,
            "errors.lead_time",
            `Mindestens ${MIN_LEAD_TIME_MINUTES} Minuten Vorlauf erforderlich.`,
          );
        }
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    });
  }, [registerValidator, draft, t]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-[var(--color-text-primary)]">{t("booking.service.heading")}</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{t("booking.service.subhead")}</p>
      </div>

      {/* Service grid */}
      <fieldset>
        <legend className="sr-only">{t("booking.service.heading")}</legend>
        <ul className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] md:grid-cols-2">
          {services.map((s) => {
            const isSelected = draft.service_id === s.id;
            return (
              <li key={s.id} className="bg-[var(--color-bg-surface)]">
                <button
                  type="button"
                  onClick={() => updateDraft({ service_id: s.id })}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-2 p-6 text-left transition-all duration-base ease-out-premium",
                    isSelected
                      ? "bg-[var(--color-bg-page)]"
                      : "hover:bg-[var(--color-bg-page)]",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10.5px] font-semibold uppercase tracking-[0.20em]",
                      isSelected ? "text-[var(--color-accent-primary)]" : "text-[var(--color-text-secondary)]",
                    )}
                  >
                    {isSelected
                      ? pickT(t, "booking.service.selected", "Ausgewaehlt")
                      : pickT(t, "booking.service.select", "Auswaehlen")}
                  </span>
                  <span className="font-serif text-xl tracking-tight text-[var(--color-text-primary)]">
                    {s.title}
                  </span>
                  <span className="line-clamp-2 text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
                    {s.short_description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {errors.service && (
          <p role="alert" className="mt-2 text-xs font-medium text-[var(--color-accent-warm)]">
            {errors.service}
          </p>
        )}
      </fieldset>

      {/* Datetime */}
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          type="date"
          label={t("booking.service.date_label")}
          required
          min={todayStr()}
          max={dateOffsetStr(MAX_ADVANCE_DAYS)}
          value={draft.pickup_date ?? ""}
          onChange={(e) => updateDraft({ pickup_date: e.target.value })}
          error={errors.date}
        />
        <Input
          type="time"
          label={t("booking.service.time_label")}
          required
          value={draft.pickup_time ?? ""}
          onChange={(e) => updateDraft({ pickup_time: e.target.value })}
          error={errors.time}
        />
      </div>
    </div>
  );
}
