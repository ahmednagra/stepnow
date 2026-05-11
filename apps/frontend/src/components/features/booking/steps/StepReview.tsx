// apps/frontend/src/components/features/booking/steps/StepReview.tsx
// Phase 3d polish — addresses audit H-8.
//   • Review sections each show an inline "Edit" link to jump back to that step.
//   • Hairline rhythm, gold-deep section labels.
//   • DSGVO consent + final submit at the bottom.

"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type {
  BookingSubmitted,
  Locale,
  ServicePublic,
} from "@/types";
import type { WizardStep } from "@/types/booking-wizard";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { Button, Checkbox } from "@/components/ui";
import { submitBooking } from "@/services/booking";

interface StepReviewProps {
  t: TFunction;
  locale: Locale;
  services: ServicePublic[];
  onJumpTo: (s: WizardStep) => void;
  onSubmitted: (result: BookingSubmitted) => void;
}

export function StepReview({
  t,
  locale,
  services,
  onJumpTo,
  onSubmitted,
}: StepReviewProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const reset = useBookingWizardStore((s) => s.reset);
  const [consent, setConsent] = useState(!!draft.consent_dsgvo);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === draft.service_id);
  const privacyHref = locale === "de" ? "/datenschutz" : "/en/privacy";

  async function handleSubmit() {
    if (!consent) {
      setError(t("errors.consent_required"));
      return;
    }
    if (!draft.pickup_date || !draft.pickup_time) {
      setError(t("errors.required"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const requested_datetime = new Date(
        `${draft.pickup_date}T${draft.pickup_time}:00`,
      ).toISOString();
      const result = await submitBooking({
        service_id: draft.service_id ?? null,
        requested_datetime,
        pickup_address: draft.pickup_address ?? "",
        pickup_postcode: draft.pickup_postcode || null,
        pickup_city: draft.pickup_city || null,
        destination_address: draft.destination_address ?? "",
        destination_postcode: draft.destination_postcode || null,
        destination_city: draft.destination_city || null,
        passenger_count: draft.passenger_count ?? 1,
        luggage_count: draft.luggage_count ?? 0,
        special_requirements: draft.special_requirements || null,
        customer_name: draft.customer_name ?? "",
        customer_phone: draft.customer_phone ?? "",
        customer_email: draft.customer_email ?? "",
        is_business: !!draft.is_business,
        company_name: draft.is_business ? draft.company_name || null : null,
        company_vatid: draft.is_business ? draft.company_vatid || null : null,
        consent_dsgvo: true,
        language: locale,
        website: draft.website ?? "",
      });
      reset();
      onSubmitted(result);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">{t("booking.review.heading")}</h2>
        <p className="mt-2 text-mute">{t("booking.review.subhead")}</p>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        <ReviewSection
          eyebrow={t("booking.step.service")}
          onEdit={() => onJumpTo("service")}
        >
          <ReviewRow label={t("booking.review.service") || "Leistung"} value={service?.title ?? "—"} />
          <ReviewRow
            label={t("booking.review.when") || "Wann"}
            value={
              draft.pickup_date && draft.pickup_time
                ? `${draft.pickup_date} · ${draft.pickup_time}`
                : "—"
            }
          />
        </ReviewSection>

        <ReviewSection eyebrow={t("booking.step.route")} onEdit={() => onJumpTo("route")}>
          <ReviewRow
            label={t("booking.route.pickup_label") || "Abholung"}
            value={[
              draft.pickup_address,
              [draft.pickup_postcode, draft.pickup_city].filter(Boolean).join(" "),
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <ReviewRow
            label={t("booking.route.destination_label") || "Ziel"}
            value={[
              draft.destination_address,
              [draft.destination_postcode, draft.destination_city]
                .filter(Boolean)
                .join(" "),
            ]
              .filter(Boolean)
              .join(", ")}
          />
        </ReviewSection>

        <ReviewSection eyebrow={t("booking.step.details")} onEdit={() => onJumpTo("details")}>
          <ReviewRow
            label={t("booking.details.passengers_label") || "Fahrgäste"}
            value={String(draft.passenger_count ?? 1)}
          />
          <ReviewRow
            label={t("booking.details.luggage_label") || "Gepäck"}
            value={String(draft.luggage_count ?? 0)}
          />
          {draft.special_requirements && (
            <ReviewRow
              label={t("booking.details.notes_label") || "Hinweise"}
              value={draft.special_requirements}
            />
          )}
        </ReviewSection>

        <ReviewSection eyebrow={t("booking.step.contact")} onEdit={() => onJumpTo("contact")}>
          <ReviewRow label="Name" value={draft.customer_name ?? "—"} />
          <ReviewRow label="Telefon" value={draft.customer_phone ?? "—"} />
          <ReviewRow label="E-Mail" value={draft.customer_email ?? "—"} />
          {draft.is_business && (
            <>
              <ReviewRow label="Firma" value={draft.company_name ?? "—"} />
              <ReviewRow label="USt-IdNr" value={draft.company_vatid ?? "—"} />
            </>
          )}
        </ReviewSection>
      </ul>

      <Checkbox
        label={
          <>
            {t("booking.review.consent_intro") || "Ich stimme der "}
            <Link href={privacyHref} className="underline hover:text-gold-deep">
              {t("footer.legal.datenschutz")}
            </Link>{" "}
            {t("booking.review.consent_zu") || "zu."}
          </>
        }
        required
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
      />

      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          size="lg"
          onClick={handleSubmit}
          isLoading={submitting}
          trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {t("booking.review.submit") || "Anfrage absenden"}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  eyebrow,
  onEdit,
  children,
}: {
  eyebrow: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {eyebrow}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-mute transition-colors hover:text-ink"
        >
          <Pencil className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          Ändern
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-1.5">{children}</dl>
    </li>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 text-[14px]">
      <dt className="text-mute">{label}</dt>
      <dd className="font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}
