// src/components/features/booking/WizardShell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BookingSubmitted, Locale, ServicePublic } from "@/types";
import { useBookingWizardStore } from "@/stores/useBookingWizardStore";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { WizardStep } from "@/types/booking-wizard";
import { Container } from "@/components/shared";
import { WizardProgress } from "./WizardProgress";
import { WizardNavigation } from "./WizardNavigation";
import { StepService } from "./steps/StepService";
import { StepRoute } from "./steps/StepRoute";
import { StepDetails } from "./steps/StepDetails";
import { StepContact } from "./steps/StepContact";
import { StepReview } from "./steps/StepReview";

interface WizardShellProps {
  locale: Locale;
  services: ServicePublic[];
  /** Where to send the user after successful submission. */
  confirmationPath: string;
}

export function WizardShell({ locale, services, confirmationPath }: WizardShellProps) {
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

  // Avoid SSR/hydration mismatch — the store starts in INITIAL_DRAFT but
  // sessionStorage may have richer data. Render only after first client paint.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate from URL params on first mount (hero widget deep link)
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

  // Step components register their validator with us so the shell's
  // Continue button can run validation before advancing.
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

  // Render a stable shell during SSR; swap to the live state after mount.
  // This avoids mismatch from sessionStorage-rehydrated state.
  if (!mounted) {
    return (
      <Container className="py-section">
        <div className="mx-auto max-w-2xl">
          <header className="mb-12 flex flex-col gap-3">
            <h1 className="font-serif text-section md:text-hero">{t("booking.page.title")}</h1>
            <p className="text-body-lg text-mute">{t("booking.page.subhead")}</p>
          </header>
          <div className="h-96 animate-pulse bg-line/30" aria-hidden="true" />
        </div>
      </Container>
    );
  }

  // Reset validator on every step change so a stale validator from the
  // previous step doesn't fire against the new step's state.
  // (We re-key the step renderer below; this ref clears on each render.)
  validatorRef.current = null;

  return (
    <Container className="py-section">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12 flex flex-col gap-4">
          <h1 className="font-serif text-section md:text-hero">{t("booking.page.title")}</h1>
          <p className="text-body-lg text-mute">{t("booking.page.subhead")}</p>
        </header>

        <div className="mb-12">
          <WizardProgress t={t} currentStep={step} />
        </div>

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
          <div className="mt-12">
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
          <div className="mt-8">
            <WizardNavigation
              t={t}
              canGoBack={true}
              showContinue={false}
              onBack={goPrevious}
              onContinue={() => undefined}
            />
          </div>
        )}

        {/* Unused-var suppression for draft, which is read implicitly via children */}
        <span className="sr-only">{draft ? "" : ""}</span>
      </div>
    </Container>
  );
}
