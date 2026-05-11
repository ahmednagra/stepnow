// src/components/features/booking/steps/StepReview.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic } from "@/types";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { step5Schema, combineToIso } from "@/schemas/booking.schema";
import { submitBooking } from "@/services/bookings";
import { ApiError } from "@/lib/api-errors";
import { Alert, Button, Checkbox } from "@/components/ui";
import { formatDate } from "@/utils/formatters";
import type { BookingSubmitted } from "@/types";

interface StepReviewProps {
  t: TFunction;
  locale: Locale;
  services: ServicePublic[];
  onJumpTo: (step: "service" | "route" | "details" | "contact") => void;
  onSubmitted: (result: BookingSubmitted) => void;
}

function formatPickupDisplay(date: string | undefined, time: string | undefined, locale: Locale): string {
  if (!date || !time) return "—";
  return `${formatDate(date, locale)} · ${time}`;
}

export function StepReview({ t, locale, services, onJumpTo, onSubmitted }: StepReviewProps) {
  const draft = useBookingWizardStore((s) => s.draft);
  const updateDraft = useBookingWizardStore((s) => s.updateDraft);
  const reset = useBookingWizardStore((s) => s.reset);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const service = services.find((s) => s.id === draft.service_id);

  async function onSubmit() {
    setServerError(null);
    // Client-side consent check
    const consentResult = step5Schema.safeParse({
      consent_dsgvo: draft.consent_dsgvo,
      website: draft.website ?? "",
    });
    if (!consentResult.success) {
      const issue = consentResult.error.issues[0];
      setConsentError(t(issue?.message ?? "errors.consent_required"));
      return;
    }
    setConsentError(null);

    // Assemble BookingCreate
    const iso = combineToIso(draft.pickup_date ?? "", draft.pickup_time ?? "");
    if (!iso || !draft.service_id) {
      setServerError(t("errors.generic"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBooking({
        service_id: draft.service_id,
        pickup_address: draft.pickup_address ?? "",
        pickup_postcode: draft.pickup_postcode || undefined,
        pickup_city: draft.pickup_city || undefined,
        destination_address: draft.destination_address ?? "",
        destination_postcode: draft.destination_postcode || undefined,
        destination_city: draft.destination_city || undefined,
        requested_datetime: iso,
        passenger_count: draft.passenger_count ?? 1,
        luggage_count: draft.luggage_count ?? 0,
        special_requirements: draft.special_requirements || undefined,
        customer_name: draft.customer_name ?? "",
        customer_phone: draft.customer_phone ?? "",
        customer_email: draft.customer_email ?? "",
        is_business: draft.is_business ?? false,
        company_name: draft.is_business ? draft.company_name || undefined : undefined,
        company_vatid: draft.is_business ? draft.company_vatid || undefined : undefined,
        language: locale,
        consent_dsgvo: true,
      });
      reset();
      onSubmitted(result);
    } catch (err) {
      if (err instanceof ApiError) {
        // Per frontend.md §9.4: surface backend's localized message verbatim
        setServerError(err.message);
      } else {
        setServerError(t("errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h2 className="font-serif text-section">{t("booking.review.heading")}</h2>
        <p className="max-w-prose text-mute">{t("booking.review.subhead")}</p>
      </header>

      {serverError && (
        <Alert tone="danger" title={t("errors.generic")}>
          {serverError}
        </Alert>
      )}

      <dl className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
        <ReviewBlock
          heading={t("booking.review.section.service")}
          onEdit={() => onJumpTo("service")}
          editLabel={t("common.edit")}
          items={[
            { label: t("booking.service.label"), value: service?.title ?? "—" },
            {
              label: t("booking.datetime.heading"),
              value: formatPickupDisplay(draft.pickup_date, draft.pickup_time, locale),
            },
          ]}
        />
        <ReviewBlock
          heading={t("booking.review.section.route")}
          onEdit={() => onJumpTo("route")}
          editLabel={t("common.edit")}
          items={[
            {
              label: t("booking.route.pickup_heading"),
              value: joinAddress(draft.pickup_address, draft.pickup_postcode, draft.pickup_city),
            },
            {
              label: t("booking.route.destination_heading"),
              value: joinAddress(
                draft.destination_address,
                draft.destination_postcode,
                draft.destination_city,
              ),
            },
          ]}
        />
        <ReviewBlock
          heading={t("booking.review.section.details")}
          onEdit={() => onJumpTo("details")}
          editLabel={t("common.edit")}
          items={[
            { label: t("booking.details.passengers_label"), value: String(draft.passenger_count ?? 1) },
            { label: t("booking.details.luggage_label"), value: String(draft.luggage_count ?? 0) },
            ...(draft.special_requirements
              ? [{ label: t("booking.details.special_label"), value: draft.special_requirements }]
              : []),
          ]}
        />
        <ReviewBlock
          heading={t("booking.review.section.contact")}
          onEdit={() => onJumpTo("contact")}
          editLabel={t("common.edit")}
          items={[
            { label: t("booking.contact.name_label"), value: draft.customer_name ?? "—" },
            { label: t("booking.contact.phone_label"), value: draft.customer_phone ?? "—" },
            { label: t("booking.contact.email_label"), value: draft.customer_email ?? "—" },
            ...(draft.is_business
              ? [
                  {
                    label: t("booking.contact.company_name_label"),
                    value: draft.company_name ?? "—",
                  },
                ]
              : []),
          ]}
        />
      </dl>

      {/* Honeypot — visually hidden but reachable */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={draft.website ?? ""}
            onChange={(e) => updateDraft({ website: e.target.value })}
          />
        </label>
      </div>

      <Checkbox
        label={
          <span>
            {t("booking.review.consent")}{" "}
            <Link
              href={locale === "de" ? "/datenschutz" : "/en/privacy"}
              className="text-gold-dark underline underline-offset-4 hover:text-ink"
            >
              {t("booking.review.consent_link")}
            </Link>
          </span>
        }
        checked={draft.consent_dsgvo ?? false}
        onChange={(e) => {
          updateDraft({ consent_dsgvo: e.target.checked });
          if (e.target.checked) setConsentError(null);
        }}
        error={consentError ?? undefined}
      />

      <div className="flex flex-col gap-3">
        <Button onClick={onSubmit} isLoading={submitting} size="lg" variant="primary">
          {t("booking.review.submit")}
        </Button>
        <p className="text-xs text-mute">{t("booking.review.submit_note")}</p>
      </div>
    </div>
  );
}

interface ReviewItem {
  label: string;
  value: string;
}

function ReviewBlock({
  heading,
  onEdit,
  editLabel,
  items,
}: {
  heading: string;
  onEdit: () => void;
  editLabel: string;
  items: ReviewItem[];
}) {
  return (
    <div className="bg-cream p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="label-eyebrow">{heading}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs text-gold-dark transition-colors duration-base hover:text-ink"
          aria-label={editLabel}
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          {editLabel}
        </button>
      </div>
      <dl className="mt-4 flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <dt className="text-xs text-mute">{item.label}</dt>
            <dd className="text-sm font-medium text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function joinAddress(
  address: string | undefined,
  postcode: string | undefined,
  city: string | undefined,
): string {
  const cityPart = [postcode, city].filter(Boolean).join(" ");
  return [address, cityPart].filter(Boolean).join(", ") || "—";
}
