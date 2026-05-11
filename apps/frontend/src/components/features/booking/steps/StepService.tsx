// src/components/features/booking/steps/StepService.tsx
"use client";

import { useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic } from "@/types";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { step1Schema } from "@/schemas/booking.schema";
import { MAX_ADVANCE_DAYS } from "@/constants/booking-wizard";
import { ServiceCard } from "../ServiceCard";
import { DateTimeField } from "../DateTimeField";

interface StepServiceProps {
  t: TFunction;
  locale: Locale;
  services: ServicePublic[];
  onValidated: () => void;
  /** Bound externally — exposes a "trigger validation" handle to the shell. */
  registerValidator?: (validate: () => boolean) => void;
}

type FieldErrors = Partial<Record<"service_id" | "pickup_date" | "pickup_time", string>>;

/** YYYY-MM-DD for today (local). */
function todayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD for `n` days from now (local). */
function dateOffsetStr(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function StepService({ t, locale, services, registerValidator }: StepServiceProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const result = step1Schema.safeParse({
      service_id: draft.service_id,
      pickup_date: draft.pickup_date,
      pickup_time: draft.pickup_time,
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

  // Expose validator upward
  registerValidator?.(validate);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h2 className="font-serif text-section">{t("booking.service.heading")}</h2>
        <p className="max-w-prose text-mute">{t("booking.service.subhead")}</p>
      </header>

      {/* Service selection */}
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t("booking.service.label")}</legend>
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            selected={draft.service_id === s.id}
            onSelect={(id) => {
              updateDraft({ service_id: id });
              setErrors((e) => ({ ...e, service_id: undefined }));
            }}
            name="service"
          />
        ))}
        {errors.service_id && (
          <p role="alert" className="text-xs text-red-600">
            {errors.service_id}
          </p>
        )}
      </fieldset>

      {/* Date + time */}
      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h3 className="font-serif text-xl tracking-tight">{t("booking.datetime.heading")}</h3>
        <DateTimeField
          date={draft.pickup_date ?? ""}
          time={draft.pickup_time ?? ""}
          onDateChange={(date) => {
            updateDraft({ pickup_date: date });
            setErrors((e) => ({ ...e, pickup_date: undefined, pickup_time: undefined }));
          }}
          onTimeChange={(time) => {
            updateDraft({ pickup_time: time });
            setErrors((e) => ({ ...e, pickup_time: undefined }));
          }}
          dateLabel={t("booking.datetime.date_label")}
          timeLabel={t("booking.datetime.time_label")}
          hint={t("booking.datetime.hint")}
          dateError={errors.pickup_date}
          timeError={errors.pickup_time}
          minDate={todayStr()}
          maxDate={dateOffsetStr(MAX_ADVANCE_DAYS)}
        />
      </section>

      {/* Suppress unused-var lint for locale */}
      <span className="sr-only">{locale}</span>
    </div>
  );
}
