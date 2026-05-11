// apps/frontend/src/components/features/booking/BookingConfirmation.tsx
// New polished confirmation surface (audit H-9). Replaces the previous bare
// "Danke" screen with an editorial layout:
//   • Gold serif checkmark badge.
//   • Reference number in monospace, large, with copy-to-clipboard.
//   • Next-step list (3 items) and an "Urgent?" call line.
//   • Two CTAs: back home + call.

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

export function BookingConfirmation({
  reference,
  settings,
  homeHref,
}: BookingConfirmationProps) {
  const { t } = useUiStrings();
  const [copied, setCopied] = useState(false);

  async function copyRef() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail — clipboard is best-effort.
    }
  }

  return (
    <Container className="py-section">
      <div className="mx-auto max-w-2xl text-center">
        {/* Gold checkmark badge */}
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center border border-gold/40 bg-paper text-gold-deep">
          <Check className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {pickT(t, "booking.confirmation.eyebrow", "Anfrage erhalten")}
        </p>
        <h1 className="mt-3 font-serif text-section md:text-hero">
          {pickT(t, "booking.confirmation.heading", "Danke! Ihre Anfrage ist eingegangen.")}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-mute">
          {pickT(t, "booking.confirmation.body", "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot.")}
        </p>

        {/* Reference number */}
        {reference && (
          <div className="mx-auto mt-12 max-w-md border border-line bg-paper p-6 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
              {pickT(t, "booking.confirmation.reference_label", "Referenznummer")}
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <code className="font-mono text-lg tracking-wider text-ink select-all">
                {reference}
              </code>
              <button
                type="button"
                onClick={copyRef}
                aria-label={copied ? "Copied" : "Copy reference"}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-gold-deep transition-colors hover:text-ink"
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    {pickT(t, "common.copied", "Kopiert")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    {pickT(t, "common.copy", "Kopieren")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Next steps list */}
        <ol className="mx-auto mt-12 max-w-lg text-left">
          {[
            t("booking.confirmation.next_step_1"),
            t("booking.confirmation.next_step_2"),
            t("booking.confirmation.next_step_3"),
          ]
            .filter(Boolean)
            .map((stepText, idx) => (
              <li
                key={idx}
                className="flex items-start gap-5 border-b border-line py-5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-lg tabular-nums text-gold-deep"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{stepText}</p>
              </li>
            ))}
        </ol>

        {/* Urgent CTA */}
        <div className="mx-auto mt-12 max-w-md border-t border-line pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mute">
            {pickT(t, "booking.confirmation.urgent_heading", "Dringend?")}
          </p>
          <p className="mt-3 text-[14.5px] text-mute">
            {pickT(t, "booking.confirmation.urgent_body", "Für kurzfristige Buchungen rufen Sie uns direkt an.")}
          </p>
          <a
            href={toTelHref(settings.phone)}
            className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-ink transition-colors hover:text-gold-deep"
          >
            <Phone className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
            <span className="tabular-nums">{settings.phone}</span>
          </a>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href={homeHref}>
            <Button
              size="lg"
              variant="secondary"
              leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            >
              {pickT(t, "booking.confirmation.cta_home", "Zur Startseite")}
            </Button>
          </Link>
          <a href={toTelHref(settings.phone)}>
            <Button
              size="lg"
              variant="outline"
              leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />}
            >
              {pickT(t, "booking.confirmation.cta_call", "Jetzt anrufen")}
            </Button>
          </a>
        </div>
      </div>
    </Container>
  );
}
