// apps/frontend/src/components/features/booking/steps/StepContact.tsx
// Phase 3d polish — refined contact step with optional business toggle.

"use client";

import { useEffect, useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { Input, Checkbox } from "@/components/ui";
import { pickT } from "@/lib/i18n/pick";

interface StepContactProps {
  t: TFunction;
  registerValidator: (fn: () => boolean) => void;
}

export function StepContact({ t, registerValidator }: StepContactProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  useEffect(() => {
    registerValidator(() => {
      const next: typeof errors = {};
      if (!draft.customer_name?.trim() || draft.customer_name.trim().length < 2) {
        next.name = t("errors.required");
      }
      if (!draft.customer_phone?.trim() || !/^[\d\s+\-()]{6,}$/.test(draft.customer_phone)) {
        next.phone = pickT(t, "errors.phone", "Bitte gültige Telefonnummer angeben.");
      }
      if (!draft.customer_email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.customer_email)) {
        next.email = pickT(t, "errors.email", "Bitte gültige E-Mail-Adresse angeben.");
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    });
  }, [registerValidator, draft, t]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">{t("booking.contact.heading")}</h2>
        <p className="mt-2 text-mute">{t("booking.contact.subhead")}</p>
      </div>

      <div className="flex flex-col gap-5">
        <Input
          label={pickT(t, "booking.contact.name_label", "Name")}
          required
          autoComplete="name"
          value={draft.customer_name ?? ""}
          onChange={(e) => updateDraft({ customer_name: e.target.value })}
          error={errors.name}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={pickT(t, "booking.contact.phone_label", "Telefon")}
            type="tel"
            required
            autoComplete="tel"
            value={draft.customer_phone ?? ""}
            onChange={(e) => updateDraft({ customer_phone: e.target.value })}
            error={errors.phone}
          />
          <Input
            label={pickT(t, "booking.contact.email_label", "E-Mail")}
            type="email"
            required
            autoComplete="email"
            value={draft.customer_email ?? ""}
            onChange={(e) => updateDraft({ customer_email: e.target.value })}
            error={errors.email}
          />
        </div>

        <Checkbox
          label={pickT(t, "booking.contact.business_toggle", "Ich buche als Geschäftskunde")}
          checked={!!draft.is_business}
          onChange={(e) => updateDraft({ is_business: e.target.checked })}
        />

        {draft.is_business && (
          <div className="grid gap-5 border-l-2 border-gold/50 pl-6 md:grid-cols-2">
            <Input
              label={pickT(t, "booking.contact.company_label", "Firmenname")}
              value={draft.company_name ?? ""}
              onChange={(e) => updateDraft({ company_name: e.target.value })}
              autoComplete="organization"
            />
            <Input
              label={pickT(t, "booking.contact.vat_label", "USt-IdNr")}
              value={draft.company_vatid ?? ""}
              onChange={(e) => updateDraft({ company_vatid: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
