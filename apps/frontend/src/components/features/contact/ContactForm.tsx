// apps/frontend/src/components/features/contact/ContactForm.tsx
// Contact form. Adds a time-since-mount honeypot: a submit within 1500ms of mounting is silently treated as a bot — mimic success without hitting the API (M-10). Layered with the existing 'website' field honeypot.

"use client";

import { useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import Link from "next/link";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Button, Input, Textarea, Select, Checkbox } from "@/components/ui";
import { submitContact } from "@/services/contact";
import { pickT } from "@/lib/i18n/pick";

const SUBJECT_OPTIONS = [
{ value: "general", labelKey: "contact.form.subject.general" },
{ value: "booking", labelKey: "contact.form.subject.booking" },
{ value: "complaint", labelKey: "contact.form.subject.complaint" },
{ value: "business", labelKey: "contact.form.subject.business" },
{ value: "other", labelKey: "contact.form.subject.other" },
] as const;

const schema = z.object({
name: z.string().min(2),
email: z.string().email(),
phone: z.string().optional(),
subject_category: z.enum(["general", "booking", "complaint", "business", "other"]),
message: z.string().min(10).max(2000),
consent_dsgvo: z.literal(true),
website: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const MIN_FILL_MS = 1500;

interface ContactFormProps {
id?: string;
}

export function ContactForm({ id }: ContactFormProps) {
const { t, locale } = useUiStrings();
const [submitted, setSubmitted] = useState(false);
const [serverError, setServerError] = useState<string | null>(null);
const mountedAtRef = useRef<number>(Date.now());
const {
register,
handleSubmit,
watch,
formState: { errors, isSubmitting },
} = useForm<FormValues>({
resolver: zodResolver(schema),
defaultValues: {
subject_category: "general",
consent_dsgvo: false as unknown as true,
},
});

const messageValue = watch("message") ?? "";
const privacyHref = locale === "de" ? "/datenschutz" : "/en/privacy";

const onSubmit: SubmitHandler<FormValues> = async (data) => {
setServerError(null);
const elapsed = Date.now() - mountedAtRef.current;
if (elapsed < MIN_FILL_MS || data.website) {
setSubmitted(true);
return;
}
try {
await submitContact({ ...data, language: locale });
setSubmitted(true);
} catch {
setServerError(t("errors.generic"));
}
};

if (submitted) {
return (
<div className="border border-gold/30 bg-paper p-8">
<div className="inline-flex h-12 w-12 items-center justify-center border border-gold/40 text-gold-deep">
<Check className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
</div>
<p className="mt-6 font-serif text-2xl tracking-tight text-ink">
{pickT(t, "contact.form.success.heading", "Vielen Dank!")}
</p>
<p className="mt-3 text-mute">
{pickT(t, "contact.form.success.body", "Wir melden uns innerhalb eines Werktages bei Ihnen.")}
</p>
</div>
);
}

return (
<form id={id} onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
{/* Honeypot — hidden visually but accessible to bots. */}
<input
type="text"
tabIndex={-1}
autoComplete="off"
aria-hidden="true"
className="absolute -left-[9999px] h-0 w-0 opacity-0"
{...register("website")}
/>
<div className="grid gap-5 md:grid-cols-2">
<Input
label={pickT(t, "contact.form.name", "Name")}
required
autoComplete="name"
error={errors.name && t("errors.required")}
{...register("name")}
/>
<Input
label={pickT(t, "contact.form.email", "E-Mail")}
type="email"
required
autoComplete="email"
error={errors.email && t("errors.email")}
{...register("email")}
/>
</div>
<div className="grid gap-5 md:grid-cols-2">
<Input
label={pickT(t, "contact.form.phone", "Telefon (optional)")}
type="tel"
autoComplete="tel"
{...register("phone")}
/>
<Select
label={pickT(t, "contact.form.subject", "Betreff")}
required
{...register("subject_category")}
>
{SUBJECT_OPTIONS.map((opt) => (
<option key={opt.value} value={opt.value}>
{t(opt.labelKey)}
</option>
))}
</Select>
</div>
<Textarea
label={pickT(t, "contact.form.message", "Nachricht")}
rows={6}
required
showCounter
maxChars={2000}
error={errors.message && t("errors.required")}
{...register("message")}
value={messageValue}
/>
<Checkbox
label={
<>
{pickT(t, "contact.form.consent_intro", "Ich stimme der ")}
<Link href={privacyHref} className="underline hover:text-gold-deep">
{t("footer.legal.datenschutz")}
</Link>{" "}
{pickT(t, "contact.form.consent_zu", "zu.")}
</>
}
required
error={errors.consent_dsgvo && t("errors.consent_required")}
{...register("consent_dsgvo")}
/>
{serverError && (
<p role="alert" className="text-[13px] font-medium text-danger">
{serverError}
</p>
)}
<div className="mt-2">
<Button type="submit" size="lg" isLoading={isSubmitting}>
{pickT(t, "contact.form.submit", "Nachricht senden")}
</Button>
</div>
</form>
);
}
