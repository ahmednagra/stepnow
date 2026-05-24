// apps/frontend/src/components/features/booking/BookingConfirmation.tsx
// Compact single-viewport confirmation: checkmark + status header, reference card centered, horizontal 3-step timeline, footer strip with CTAs and urgent inline.

"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Phone, Copy, CheckCheck, ArrowLeft } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";

interface BookingConfirmationProps {
  reference: string | null;
  settings: SettingsPublic;
  homeHref: string;
}

export function BookingConfirmation({ reference, settings, homeHref }: BookingConfirmationProps) {
  const { t, locale } = useUiStrings();
  const [copied, setCopied] = useState(false);

  async function copyRef() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const steps = [
    t("booking.confirmation.next_step_1"),
    t("booking.confirmation.next_step_2"),
    t("booking.confirmation.next_step_3"),
  ].filter(Boolean);

  const copyLabel = pickT(t, "common.copy", locale === "de" ? "Kopieren" : "Copy");
  const copiedLabel = pickT(t, "common.copied", locale === "de" ? "Kopiert" : "Copied");

  return (
    <Container className="py-section">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
          <div className="border-b border-[color:var(--color-border-soft)] px-6 py-7 md:px-8 md:py-8">
            <div className="flex items-start gap-5">
              <span
                aria-hidden="true"
                className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]"
              >
                <Check className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
                  {pickT(t, "booking.confirmation.eyebrow", locale === "de" ? "Anfrage erhalten" : "Request received")}
                </p>
                <h2 className="mt-1.5 font-serif text-[26px] leading-[1.15] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
                  {t("booking.confirmation.heading")}
                </h2>
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  {pickT(t, "booking.confirmation.body", locale === "de"
                    ? "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot."
                    : "We'll get back to you within 30 minutes with a fixed-price quote."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-7 md:px-8 md:py-8">
            {reference && (
              <div className="flex flex-col items-stretch gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] sm:flex-row">
                <div className="flex-1 bg-[var(--color-bg-page)] px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    {t("booking.confirmation.reference_label")}
                  </p>
                  <code className="mt-1 block font-mono text-[16px] tracking-wider text-[var(--color-text-primary)] select-all">
                    {reference}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyRef}
                  aria-label={copied ? copiedLabel : copyLabel}
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-bg-page)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-bg-accent-soft)] hover:text-[var(--color-text-primary)] sm:px-7"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>{copiedLabel}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>{copyLabel}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-9">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
                {pickT(t, "booking.confirmation.next_steps_heading", locale === "de" ? "Wie es weitergeht" : "What happens next")}
              </p>
              <ol className="mt-3 grid grid-cols-1 gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] md:grid-cols-3">
                {steps.map((stepText, idx) => (
                  <li key={idx} className="flex flex-col gap-2 bg-[var(--color-bg-page)] p-5">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="font-serif text-[22px] leading-none tabular-nums text-[var(--color-accent-primary)]">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span aria-hidden="true" className="block h-px flex-1 bg-[rgba(85,133,24,0.24)]" />
                    </div>
                    <p className="text-[13px] leading-[1.55] text-[var(--color-text-primary)]">{stepText}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-9 flex flex-col gap-4 border-t border-[color:var(--color-border-soft)] pt-6 md:flex-row md:items-center md:justify-between md:gap-8">
              <p className="flex items-start gap-3 text-[13px] text-[var(--color-text-secondary)] md:max-w-md">
                <span className="mt-px shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-primary)]">
                  {pickT(t, "booking.confirmation.urgent_heading", locale === "de" ? "Dringend?" : "Urgent?")}
                </span>
                <span className="flex-1">
                  {pickT(t, "booking.confirmation.urgent_body", locale === "de"
                    ? "Für kurzfristige Buchungen direkt anrufen."
                    : "For short-notice bookings, call us directly."
                  )}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={homeHref}>
                  <Button size="sm" variant="ghost" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}>
                    {pickT(t, "booking.confirmation.cta_home", locale === "de" ? "Zur Startseite" : "Back to homepage")}
                  </Button>
                </Link>
                <a href={toTelHref(settings.phone)}>
                  <Button size="sm" variant="secondary" leadingIcon={<Phone className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />}>
                    <span className="tabular-nums">{settings.phone}</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "booking.confirmation.sidebar.eyebrow", locale === "de" ? "Ihre Anfrage" : "Your request")}
            </p>
            <h2 className="mt-2 font-serif text-[28px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
              {pickT(t, "booking.confirmation.sidebar.heading", locale === "de" ? "Persoenlich bestaetigt, nicht automatisch abgefertigt" : "Personally confirmed, not auto-processed")}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {pickT(
                t,
                "booking.confirmation.sidebar.body",
                locale === "de"
                  ? "Ihre Anfrage wird manuell geprueft. So koennen wir Route, Verfuegbarkeit und besondere Hinweise sauber bestaetigen."
                  : "Your request is checked manually so we can confirm route, availability, and any special requirements properly.",
              )}
            </p>
          </div>

          <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "booking.confirmation.contact.eyebrow", locale === "de" ? "Direkter Kontakt" : "Direct contact")}
            </p>
            <h2 className="mt-2 font-serif text-[26px] leading-tight tracking-tight text-[var(--color-text-primary)]">
              {pickT(t, "booking.confirmation.contact.heading", locale === "de" ? "Rueckfragen oder kurzfristige Fahrt?" : "Questions or a short-notice ride?")}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {pickT(
                t,
                "booking.confirmation.contact.body",
                locale === "de"
                  ? "Wenn sich etwas aendert oder die Fahrt dringend ist, erreichen Sie uns direkt per Telefon."
                  : "If anything changes or the booking is urgent, you can reach us directly by phone.",
              )}
            </p>
            <a
              href={toTelHref(settings.phone)}
              className="mt-6 inline-flex items-center gap-2 border-b border-[rgba(85,133,24,0.3)] pb-0.5 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]"
            >
              <Phone className="h-4 w-4 text-[var(--color-accent-primary)]" aria-hidden="true" strokeWidth={1.5} />
              <span className="tabular-nums">{settings.phone}</span>
            </a>
            {settings.opening_hours && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
                {settings.opening_hours}
              </p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
