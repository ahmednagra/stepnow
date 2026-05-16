// apps/frontend/src/components/features/booking/steps/StepReview.tsx
// Review + submit step. Adds a time-since-mount honeypot: a submit within 1500ms of mounting is almost certainly a bot, so silently mimic success without hitting the API (M-10). Layered with the existing 'website' field honeypot.

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Pencil, ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { BookingSubmitted, Locale, ServicePublic } from "@/types";
import type { WizardStep } from "@/types/booking-wizard";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { Button, Checkbox } from "@/components/ui";
import { submitBooking } from "@/services/bookings";
import { pickT } from "@/lib/i18n/pick";

interface StepReviewProps {
t: TFunction;
locale: Locale;
services: ServicePublic[];
onJumpTo: (s: WizardStep) => void;
onSubmitted: (result: BookingSubmitted) => void;
}

const MIN_FILL_MS = 1500;

function emptyToUndef(v: string | null | undefined): string | undefined {
const trimmed = (v ?? "").trim();
return trimmed.length > 0 ? trimmed : undefined;
}

export function StepReview({ t, locale, services, onJumpTo, onSubmitted }: StepReviewProps) {
const draft = useBookingWizardStore((s) => s.draft);
const reset = useBookingWizardStore((s) => s.reset);
const [consent, setConsent] = useState(!!draft.consent_dsgvo);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const mountedAtRef = useRef<number>(Date.now());

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
const elapsed = Date.now() - mountedAtRef.current;
if (elapsed < MIN_FILL_MS || draft.website) {
reset();
onSubmitted({ reference: "SN-PENDING", status: "new", message: "ok" });
return;
}
setError(null);
setSubmitting(true);
try {
const requested_datetime = new Date(
`${draft.pickup_date}T${draft.pickup_time}:00`,
).toISOString();
const result = await submitBooking({
service_id: emptyToUndef(draft.service_id),
requested_datetime,
pickup_address: draft.pickup_address ?? "",
pickup_postcode: emptyToUndef(draft.pickup_postcode),
pickup_city: emptyToUndef(draft.pickup_city),
destination_address: draft.destination_address ?? "",
destination_postcode: emptyToUndef(draft.destination_postcode),
destination_city: emptyToUndef(draft.destination_city),
passenger_count: draft.passenger_count ?? 1,
luggage_count: draft.luggage_count ?? 0,
special_requirements: emptyToUndef(draft.special_requirements),
customer_name: draft.customer_name ?? "",
customer_phone: draft.customer_phone ?? "",
customer_email: draft.customer_email ?? "",
is_business: !!draft.is_business,
company_name: draft.is_business ? emptyToUndef(draft.company_name) : undefined,
company_vatid: draft.is_business ? emptyToUndef(draft.company_vatid) : undefined,
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
editLabel={pickT(t, "common.edit", locale === "de" ? "Ändern" : "Edit")}
onEdit={() => onJumpTo("service")}
>
<ReviewRow label={pickT(t, "booking.review.service", locale === "de" ? "Leistung" : "Service")} value={service?.title ?? "—"} />
<ReviewRow
label={pickT(t, "booking.review.when", locale === "de" ? "Wann" : "When")}
value={draft.pickup_date && draft.pickup_time ? `${draft.pickup_date} · ${draft.pickup_time}` : "—"}
/>
</ReviewSection>

<ReviewSection
eyebrow={t("booking.step.route")}
editLabel={pickT(t, "common.edit", locale === "de" ? "Ändern" : "Edit")}
onEdit={() => onJumpTo("route")}
>
<ReviewRow
label={pickT(t, "booking.route.pickup_label", locale === "de" ? "Abholung" : "Pickup")}
value={[draft.pickup_address, [draft.pickup_postcode, draft.pickup_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
/>
<ReviewRow
label={pickT(t, "booking.route.destination_label", locale === "de" ? "Ziel" : "Destination")}
value={[draft.destination_address, [draft.destination_postcode, draft.destination_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
/>
</ReviewSection>

<ReviewSection
eyebrow={t("booking.step.details")}
editLabel={pickT(t, "common.edit", locale === "de" ? "Ändern" : "Edit")}
onEdit={() => onJumpTo("details")}
>
<ReviewRow label={pickT(t, "booking.details.passengers_label", locale === "de" ? "Fahrgäste" : "Passengers")} value={String(draft.passenger_count ?? 1)} />
<ReviewRow label={pickT(t, "booking.details.luggage_label", locale === "de" ? "Gepäck" : "Luggage")} value={String(draft.luggage_count ?? 0)} />
{draft.special_requirements && (
<ReviewRow label={pickT(t, "booking.details.notes_label", locale === "de" ? "Hinweise" : "Notes")} value={draft.special_requirements} />
)}
</ReviewSection>

<ReviewSection
eyebrow={t("booking.step.contact")}
editLabel={pickT(t, "common.edit", locale === "de" ? "Ändern" : "Edit")}
onEdit={() => onJumpTo("contact")}
>
<ReviewRow label={pickT(t, "booking.contact.name_label", "Name")} value={draft.customer_name ?? "—"} />
<ReviewRow label={pickT(t, "booking.contact.phone_label", locale === "de" ? "Telefon" : "Phone")} value={draft.customer_phone ?? "—"} />
<ReviewRow label={pickT(t, "booking.contact.email_label", locale === "de" ? "E-Mail" : "Email")} value={draft.customer_email ?? "—"} />
{draft.is_business && (
<>
<ReviewRow label={pickT(t, "booking.contact.company_label", locale === "de" ? "Firma" : "Company")} value={draft.company_name ?? "—"} />
<ReviewRow label={pickT(t, "booking.contact.vat_label", locale === "de" ? "USt-IdNr." : "VAT ID")} value={draft.company_vatid ?? "—"} />
</>
)}
</ReviewSection>
</ul>

<Checkbox
label={
<>
{pickT(t, "booking.review.consent_intro", locale === "de" ? "Ich stimme der " : "I agree to the ")}
<Link href={privacyHref} className="underline hover:text-gold-deep">
{t("footer.legal.datenschutz")}
</Link>{" "}
{pickT(t, "booking.review.consent_zu", locale === "de" ? "zu." : ".")}
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
{pickT(t, "booking.review.submit", locale === "de" ? "Anfrage absenden" : "Submit request")}
</Button>
</div>
</div>
);
}

function ReviewSection({
eyebrow,
editLabel,
onEdit,
children,
}: {
eyebrow: string;
editLabel: string;
onEdit: () => void;
children: React.ReactNode;
}) {
return (
<li className="flex flex-col gap-3 py-5">
<div className="flex items-center justify-between gap-3">
<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">{eyebrow}</p>
<button
type="button"
onClick={onEdit}
className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-mute transition-colors hover:text-ink"
>
<Pencil className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
{editLabel}
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
