// apps/frontend/src/components/features/booking/WizardShell.tsx
// Phase 3d polish — adds an eyebrow above the wizard heading, refines spacing,
// and exposes a "Need help? Call us" line under the wizard so hesitant users
// have an obvious fallback path (audit §6.3 — UX recommendation 4).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, CheckCircle2 } from "lucide-react";
import type { BookingSubmitted, Locale, ServicePublic, SettingsPublic } from "@/types";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { WizardStep } from "@/types/booking-wizard";
import { Container } from "@/components/shared";
import { toTelHref } from "@/utils/formatters";
import { WizardProgress } from "./WizardProgress";
import { WizardNavigation } from "./WizardNavigation";
import { StepService } from "./steps/StepService";
import { StepRoute } from "./steps/StepRoute";
import { StepDetails } from "./steps/StepDetails";
import { StepContact } from "./steps/StepContact";
import { StepReview } from "./steps/StepReview";
import { pickT } from "@/lib/i18n/pick";

interface WizardShellProps {
  locale: Locale;
  services: ServicePublic[];
  /** Where to send the user after successful submission. */
  confirmationPath: string;
  /** Optional — when provided, renders the help line at the bottom. */
  settings?: SettingsPublic;
}

export function WizardShell({
  locale,
  services,
  confirmationPath,
  settings,
}: WizardShellProps) {
  const { t } = useUiStrings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = useBookingWizardStore((s) => s.step);
  const goNext = useBookingWizardStore((s) => s.goNext);
  const goPrevious = useBookingWizardStore((s) => s.goPrevious);
  const setStep = useBookingWizardStore((s) => s.setStep);
  const hydratePartial = useBookingWizardStore((s) => s.hydratePartial);
  const draft = useBookingWizardStore((s) => s.draft);
  const [mounted, setMounted] = useState(false);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [mounted, step]);

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!searchParams) return;
    hydratedRef.current = true;
    const patch: Record<string, string | undefined> = {};
    const pickup = searchParams.get("pickup");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const serviceSlug = searchParams.get("service");
    if (pickup) patch.pickup_address = pickup;
    if (destination) patch.destination_address = destination;
    if (date) patch.pickup_date = date;
    if (time) patch.pickup_time = time;
    if (serviceSlug) {
      const match = services.find((s) => s.slug === serviceSlug);
      if (match) patch.service_id = match.id;
    }
    if (Object.keys(patch).length > 0) {
      hydratePartial(patch);
    }
  }, [searchParams, services, hydratePartial]);

  const validatorRef = useRef<(() => boolean) | null>(null);
  const registerValidator = (fn: () => boolean) => {
    validatorRef.current = fn;
  };

  function handleContinue() {
    const valid = validatorRef.current ? validatorRef.current() : true;
    if (valid) goNext();
  }

  function handleSubmitted(result: BookingSubmitted) {
    router.push(`${confirmationPath}?ref=${encodeURIComponent(result.reference)}`);
  }

  if (!mounted) {
    return (
      <Container className="py-section">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
          <div className="h-[680px] animate-pulse border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]" aria-hidden="true" />
          <div className="hidden lg:block h-[680px] animate-pulse border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]" aria-hidden="true" />
        </div>
      </Container>
    );
  }

  validatorRef.current = null;

  return (
    <Container className="py-section">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
        <div ref={formCardRef} className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
          <div className="border-b border-[color:var(--color-border-soft)] px-6 py-7 md:px-8 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                  {pickT(t, "booking.page.eyebrow", "Anfrage")}
                </p>
                <h2 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[34px]">
                  {pickT(t, "booking.wizard.heading", locale === "de" ? "Buchungsdetails" : "Booking details")}
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
                {pickT(
                  t,
                  "booking.wizard.summary",
                  locale === "de"
                    ? "In wenigen Schritten zur klaren Anfrage. Wir bestätigen anschliessend persoenlich."
                    : "A clear booking request in a few steps. We follow up personally after submission.",
                )}
              </p>
            </div>
            <div className="mt-7">
              <WizardProgress t={t} currentStep={step} />
            </div>
          </div>

          <div className="px-6 py-7 md:px-8 md:py-8">
            <div key={step} className="animate-fade-in">
              {step === "service" && (
                <StepService
                  t={t}
                  locale={locale}
                  services={services}
                  onValidated={goNext}
                  registerValidator={registerValidator}
                />
              )}
              {step === "route" && <StepRoute t={t} registerValidator={registerValidator} />}
              {step === "details" && <StepDetails t={t} registerValidator={registerValidator} />}
              {step === "contact" && <StepContact t={t} registerValidator={registerValidator} />}
              {step === "review" && (
                <StepReview
                  t={t}
                  locale={locale}
                  services={services}
                  onJumpTo={(s: WizardStep) => setStep(s)}
                  onSubmitted={handleSubmitted}
                />
              )}
            </div>

            {step !== "review" && (
              <div className="mt-12 border-t border-[color:var(--color-border-soft)] pt-6">
                <WizardNavigation
                  t={t}
                  canGoBack={step !== "service"}
                  showContinue={true}
                  onBack={goPrevious}
                  onContinue={handleContinue}
                />
              </div>
            )}

            {step === "review" && (
              <div className="mt-8 border-t border-[color:var(--color-border-soft)] pt-6">
                <WizardNavigation
                  t={t}
                  canGoBack={true}
                  showContinue={false}
                  onBack={goPrevious}
                  onContinue={() => undefined}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="shadow-premium border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "booking.sidebar.eyebrow", locale === "de" ? "Warum StepNow" : "Why StepNow")}
            </p>
            <h2 className="mt-2 font-serif text-[28px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
              {pickT(t, "booking.sidebar.heading", locale === "de" ? "Klare Anfrage statt offener Fahrt" : "A clear request instead of an uncertain ride")}
            </h2>
            <ul className="mt-6 grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
              {[
                pickT(t, "booking.sidebar.point_1", locale === "de" ? "Pauschalpreis und persoenliche Rueckmeldung statt unklarer Verfuegbarkeit." : "Fixed-price follow-up instead of uncertain availability."),
                pickT(t, "booking.sidebar.point_2", locale === "de" ? "Vorbestellung fuer Flughafentransfer, Krankenfahrten und private Strecken." : "Advance booking for airport transfers, hospital rides, and private routes."),
                pickT(t, "booking.sidebar.point_3", locale === "de" ? "Direkter Kontakt, falls Details vor der Fahrt abgestimmt werden muessen." : "Direct contact if details need to be clarified before the ride."),
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 bg-[var(--color-bg-page)] p-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)]">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{point}</p>
                </li>
              ))}
            </ul>
          </div>

          {settings?.phone && (
            <div className="shadow-premium border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "booking.help.eyebrow", locale === "de" ? "Direkte Hilfe" : "Direct help")}
              </p>
              <h2 className="mt-2 font-serif text-[26px] leading-tight tracking-tight text-[var(--color-text-primary)]">
                {pickT(t, "booking.help.heading", locale === "de" ? "Brauchen Sie Hilfe bei der Buchung?" : "Need help with your booking?")}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "booking.help.body",
                  locale === "de"
                    ? "Wenn die Fahrt kurzfristig ist oder besondere Anforderungen hat, rufen Sie uns direkt an."
                    : "If the ride is short notice or has special requirements, call us directly.",
                )}
              </p>
              <a
                href={toTelHref(settings.phone)}
                className="mt-6 inline-flex items-center gap-2 border-b border-[rgba(168,134,90,0.3)] pb-0.5 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]"
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
          )}
        </aside>
      </div>

      <span className="sr-only">{draft ? "" : ""}</span>
    </Container>
  );
}
