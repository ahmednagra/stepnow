// src/components/features/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUiStrings } from "@/hooks/useUiStrings";
import { submitContact } from "@/services/contact";
import { ApiError } from "@/lib/api-errors";
import { contactSchema, type ContactFormData } from "@/schemas/contact.schema";
import { Alert, Button, Checkbox, Input, Select, Textarea } from "@/components/ui";
import { CONTACT_CATEGORIES, type ContactCategory } from "@/types";

interface ContactFormProps {
  /** ID of the wrapping section, used for in-page anchor scrolling. */
  id?: string;
}

/**
 * Bilingual contact form. Client-side validation via Zod for UX, server-side
 * re-validation is authoritative. Server REQUIRED_FIELD messages are surfaced
 * verbatim per frontend.md §9.4.
 */
export function ContactForm({ id }: ContactFormProps) {
  const { t, locale } = useUiStrings();
  const [submitted, setSubmitted] = useState<{ message: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject_category: "general" satisfies ContactCategory,
      message: "",
      consent_dsgvo: undefined,
      language: locale,
      website: "",
    },
  });

  async function onSubmit(values: ContactFormData) {
    setServerError(null);
    try {
      const result = await submitContact({
        ...values,
        // Strip empty phone before send
        phone: values.phone || undefined,
        // Honeypot must not be forwarded as a real field
        website: undefined,
      });
      setSubmitted({ message: result.message });
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        // Surface backend's localized message verbatim (per frontend.md §9.4).
        setServerError(err.message);
      } else {
        setServerError(t("errors.generic"));
      }
    }
  }

  if (submitted) {
    return (
      <Alert tone="success" title={t("contact.form.success_title")} id={id}>
        {submitted.message}
      </Alert>
    );
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {serverError && (
        <Alert tone="danger" title={t("contact.form.error_title")}>
          {serverError}
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label={t("contact.form.name")}
          required
          autoComplete="name"
          {...register("name")}
          error={errors.name ? t(errors.name.message ?? "errors.required") : undefined}
        />
        <Input
          label={t("contact.form.email")}
          type="email"
          required
          autoComplete="email"
          {...register("email")}
          error={errors.email ? t(errors.email.message ?? "errors.required") : undefined}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label={t("contact.form.phone")}
          type="tel"
          autoComplete="tel"
          {...register("phone")}
          error={errors.phone ? t(errors.phone.message ?? "errors.required") : undefined}
          hint={t("contact.form.phone_hint")}
        />
        <Select
          label={t("contact.form.category")}
          required
          {...register("subject_category")}
          error={
            errors.subject_category
              ? t(errors.subject_category.message ?? "errors.required")
              : undefined
          }
        >
          {CONTACT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`contact.form.category.${cat}`)}
            </option>
          ))}
        </Select>
      </div>

      <Textarea
        label={t("contact.form.message")}
        required
        rows={6}
        {...register("message")}
        error={errors.message ? t(errors.message.message ?? "errors.required") : undefined}
      />

      {/* Honeypot — visually hidden but reachable by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

      <input type="hidden" {...register("language")} />

      <Checkbox
        label={
          <span>
            {t("contact.form.consent")}{" "}
            <a
              href={locale === "de" ? "/datenschutz" : "/en/privacy"}
              className="text-gold-dark underline underline-offset-4 hover:text-ink"
            >
              {t("contact.form.consent_link")}
            </a>
          </span>
        }
        {...register("consent_dsgvo")}
        error={
          errors.consent_dsgvo
            ? t(errors.consent_dsgvo.message ?? "errors.consent_required")
            : undefined
        }
      />

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {t("contact.form.submit")}
        </Button>
        <p className="text-xs text-mute">{t("contact.form.submit_note")}</p>
      </div>
    </form>
  );
}
