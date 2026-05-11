// apps/frontend/src/components/features/booking/steps/StepRoute.tsx
// Phase 3d polish — refined two-column route inputs.

"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { Input } from "@/components/ui";
import { pickT } from "@/lib/i18n/pick";

interface StepRouteProps {
  t: TFunction;
  registerValidator: (fn: () => boolean) => void;
}

export function StepRoute({ t, registerValidator }: StepRouteProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<{
    pickup?: string;
    destination?: string;
  }>({});

  useEffect(() => {
    registerValidator(() => {
      const next: typeof errors = {};
      if (!draft.pickup_address?.trim()) next.pickup = t("errors.required");
      if (!draft.destination_address?.trim()) next.destination = t("errors.required");
      setErrors(next);
      return Object.keys(next).length === 0;
    });
  }, [registerValidator, draft, t]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">{t("booking.route.heading")}</h2>
        <p className="mt-2 text-mute">{t("booking.route.subhead")}</p>
      </div>

      {/* Pickup */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {pickT(t, "booking.route.pickup_label", "Abholung")}
        </legend>
        <Input
          label={pickT(t, "booking.route.address_label", "Adresse")}
          required
          leadingAdornment={<MapPin className="h-4 w-4" strokeWidth={1.5} />}
          value={draft.pickup_address ?? ""}
          onChange={(e) => updateDraft({ pickup_address: e.target.value })}
          error={errors.pickup}
          autoComplete="street-address"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={pickT(t, "booking.route.postcode_label", "PLZ")}
            value={draft.pickup_postcode ?? ""}
            onChange={(e) => updateDraft({ pickup_postcode: e.target.value })}
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
          />
          <Input
            label={pickT(t, "booking.route.city_label", "Ort")}
            value={draft.pickup_city ?? ""}
            onChange={(e) => updateDraft({ pickup_city: e.target.value })}
            autoComplete="address-level2"
          />
        </div>
      </fieldset>

      {/* Destination */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {pickT(t, "booking.route.destination_label", "Ziel")}
        </legend>
        <Input
          label={pickT(t, "booking.route.address_label", "Adresse")}
          required
          leadingAdornment={<MapPin className="h-4 w-4" strokeWidth={1.5} />}
          value={draft.destination_address ?? ""}
          onChange={(e) => updateDraft({ destination_address: e.target.value })}
          error={errors.destination}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={pickT(t, "booking.route.postcode_label", "PLZ")}
            value={draft.destination_postcode ?? ""}
            onChange={(e) => updateDraft({ destination_postcode: e.target.value })}
            inputMode="numeric"
            maxLength={5}
          />
          <Input
            label={pickT(t, "booking.route.city_label", "Ort")}
            value={draft.destination_city ?? ""}
            onChange={(e) => updateDraft({ destination_city: e.target.value })}
          />
        </div>
      </fieldset>
    </div>
  );
}
