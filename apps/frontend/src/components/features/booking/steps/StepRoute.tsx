// src/components/features/booking/steps/StepRoute.tsx
"use client";

import { useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { step2Schema } from "@/schemas/booking.schema";
import { Input } from "@/components/ui";

interface StepRouteProps {
  t: TFunction;
  registerValidator?: (validate: () => boolean) => void;
}

type FieldKey =
  | "pickup_address"
  | "pickup_postcode"
  | "pickup_city"
  | "destination_address"
  | "destination_postcode"
  | "destination_city";

type FieldErrors = Partial<Record<FieldKey, string>>;

export function StepRoute({ t, registerValidator }: StepRouteProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const result = step2Schema.safeParse({
      pickup_address: draft.pickup_address ?? "",
      pickup_postcode: draft.pickup_postcode ?? "",
      pickup_city: draft.pickup_city ?? "",
      destination_address: draft.destination_address ?? "",
      destination_postcode: draft.destination_postcode ?? "",
      destination_city: draft.destination_city ?? "",
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as FieldKey;
      if (field && !next[field]) next[field] = t(issue.message);
    }
    setErrors(next);
    return false;
  }

  registerValidator?.(validate);

  function setField(key: FieldKey, value: string) {
    updateDraft({ [key]: value });
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h2 className="font-serif text-section">{t("booking.route.heading")}</h2>
        <p className="max-w-prose text-mute">{t("booking.route.subhead")}</p>
      </header>

      {/* Pickup */}
      <section className="flex flex-col gap-4">
        <h3 className="label-eyebrow">{t("booking.route.pickup_heading")}</h3>
        <Input
          label={t("booking.route.address_label")}
          required
          autoComplete="street-address"
          value={draft.pickup_address ?? ""}
          onChange={(e) => setField("pickup_address", e.target.value)}
          error={errors.pickup_address}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label={t("booking.route.postcode_label")}
            autoComplete="postal-code"
            value={draft.pickup_postcode ?? ""}
            onChange={(e) => setField("pickup_postcode", e.target.value)}
            error={errors.pickup_postcode}
          />
          <div className="md:col-span-2">
            <Input
              label={t("booking.route.city_label")}
              autoComplete="address-level2"
              value={draft.pickup_city ?? ""}
              onChange={(e) => setField("pickup_city", e.target.value)}
              error={errors.pickup_city}
            />
          </div>
        </div>
      </section>

      {/* Destination */}
      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h3 className="label-eyebrow">{t("booking.route.destination_heading")}</h3>
        <Input
          label={t("booking.route.address_label")}
          required
          value={draft.destination_address ?? ""}
          onChange={(e) => setField("destination_address", e.target.value)}
          error={errors.destination_address}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label={t("booking.route.postcode_label")}
            value={draft.destination_postcode ?? ""}
            onChange={(e) => setField("destination_postcode", e.target.value)}
            error={errors.destination_postcode}
          />
          <div className="md:col-span-2">
            <Input
              label={t("booking.route.city_label")}
              value={draft.destination_city ?? ""}
              onChange={(e) => setField("destination_city", e.target.value)}
              error={errors.destination_city}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
