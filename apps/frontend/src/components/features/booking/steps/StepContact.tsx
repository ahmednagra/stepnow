// src/components/features/booking/steps/StepContact.tsx
"use client";

import { useState } from "react";
import type { TFunction } from "@/lib/i18n/t";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { step4Schema } from "@/schemas/booking.schema";
import { Checkbox, Input } from "@/components/ui";

interface StepContactProps {
  t: TFunction;
  registerValidator?: (validate: () => boolean) => void;
}

type FieldKey =
  | "customer_name"
  | "customer_phone"
  | "customer_email"
  | "company_name"
  | "company_vatid";

type FieldErrors = Partial<Record<FieldKey, string>>;

export function StepContact({ t, registerValidator }: StepContactProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isBusiness = draft.is_business ?? false;

  function validate(): boolean {
    const result = step4Schema.safeParse({
      customer_name: draft.customer_name ?? "",
      customer_phone: draft.customer_phone ?? "",
      customer_email: draft.customer_email ?? "",
      is_business: isBusiness,
      company_name: draft.company_name ?? "",
      company_vatid: draft.company_vatid ?? "",
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
        <h2 className="font-serif text-section">{t("booking.contact.heading")}</h2>
        <p className="max-w-prose text-mute">{t("booking.contact.subhead")}</p>
      </header>

      <div className="flex flex-col gap-5">
        <Input
          label={t("booking.contact.name_label")}
          required
          autoComplete="name"
          value={draft.customer_name ?? ""}
          onChange={(e) => setField("customer_name", e.target.value)}
          error={errors.customer_name}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={t("booking.contact.phone_label")}
            type="tel"
            required
            autoComplete="tel"
            value={draft.customer_phone ?? ""}
            onChange={(e) => setField("customer_phone", e.target.value)}
            error={errors.customer_phone}
          />
          <Input
            label={t("booking.contact.email_label")}
            type="email"
            required
            autoComplete="email"
            value={draft.customer_email ?? ""}
            onChange={(e) => setField("customer_email", e.target.value)}
            error={errors.customer_email}
          />
        </div>
      </div>

      {/* Business toggle */}
      <section className="flex flex-col gap-5 border-t border-line pt-8">
        <Checkbox
          label={t("booking.contact.business_toggle")}
          checked={isBusiness}
          onChange={(e) => {
            const next = e.target.checked;
            updateDraft({ is_business: next });
            if (!next) {
              // Clear business-only errors when toggling off
              setErrors((er) => ({ ...er, company_name: undefined }));
            }
          }}
        />
        {isBusiness && (
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label={t("booking.contact.company_name_label")}
              required
              value={draft.company_name ?? ""}
              onChange={(e) => setField("company_name", e.target.value)}
              error={errors.company_name}
            />
            <Input
              label={t("booking.contact.vatid_label")}
              value={draft.company_vatid ?? ""}
              onChange={(e) => setField("company_vatid", e.target.value)}
              error={errors.company_vatid}
            />
          </div>
        )}
      </section>
    </div>
  );
}
