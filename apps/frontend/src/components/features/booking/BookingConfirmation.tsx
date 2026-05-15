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
    <Container className="py-10 md:py-12">
      <div className="mx-auto max-w-4xl">

        {/* === HEADER: badge inline with eyebrow + heading on the right === */}
        <div className="flex items-start gap-5">
          <span
            aria-hidden="true"
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center border border-gold/40 bg-paper text-gold-deep"
          >
            <Check className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
              {pickT(t, "booking.confirmation.eyebrow", locale === "de" ? "Anfrage erhalten" : "Request received")}
            </p>
            <h1 className="mt-1.5 font-serif text-[26px] leading-[1.15] tracking-tight md:text-[32px]">
              {t("booking.confirmation.heading")}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mute">
              {pickT(t, "booking.confirmation.body", locale === "de"
                ? "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot."
                : "We'll get back to you within 30 minutes with a fixed-price quote."
              )}
            </p>
          </div>
        </div>

        {/* === REFERENCE CARD === */}
        {reference && (
          <div className="mt-7 flex flex-col items-stretch gap-px border border-line bg-line sm:flex-row">
            <div className="flex-1 bg-paper px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
                {t("booking.confirmation.reference_label")}
              </p>
              <code className="mt-1 block font-mono text-[16px] tracking-wider text-ink select-all">
                {reference}
              </code>
            </div>
            <button
              type="button"
              onClick={copyRef}
              aria-label={copied ? copiedLabel : copyLabel}
              className="inline-flex items-center justify-center gap-2 bg-paper px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors hover:bg-cream hover:text-ink sm:px-7"
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

        {/* === NEXT-STEPS TIMELINE (horizontal on md+, stacked on mobile) === */}
        <div className="mt-9">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
            {pickT(t, "booking.confirmation.next_steps_heading", locale === "de" ? "Wie es weitergeht" : "What happens next")}
          </p>
          <ol className="mt-3 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
            {steps.map((stepText, idx) => (
              <li key={idx} className="flex flex-col gap-2 bg-paper p-5">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="font-serif text-[22px] leading-none tabular-nums text-gold-deep">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true" className="block h-px flex-1 bg-gold/30" />
                </div>
                <p className="text-[13px] leading-[1.55] text-ink">{stepText}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* === BOTTOM STRIP: urgent inline + CTAs === */}
        <div className="mt-9 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="flex items-start gap-3 text-[13px] text-mute md:max-w-md">
            <span className="mt-px shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink">
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
    </Container>
  );
}