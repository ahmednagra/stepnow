// apps/frontend/src/components/features/booking/WizardShell.tsx
// Phase 3d polish — adds an eyebrow above the wizard heading, refines spacing,
// and exposes a "Need help? Call us" line under the wizard so hesitant users
// have an obvious fallback path (audit §6.3 — UX recommendation 4).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone } from "lucide-react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="mx-auto max-w-2xl">
          <header className="mb-12 flex flex-col gap-4">
            <p className="label-eyebrow">{pickT(t, "booking.page.eyebrow", "Anfrage")}</p>
            <h1 className="font-serif text-section md:text-hero">{t("booking.page.title")}</h1>
            <p className="text-body-lg text-mute">{t("booking.page.subhead")}</p>
          </header>
          <div className="h-96 animate-pulse bg-line-soft" aria-hidden="true" />
        </div>
      </Container>
    );
  }

  validatorRef.current = null;

  return (
    <Container className="py-section">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="block h-px w-8 bg-gold" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
              {pickT(t, "booking.page.eyebrow", "Anfrage")}
            </p>
          </div>
          <h1 className="font-serif text-section md:text-hero">{t("booking.page.title")}</h1>
          <p className="max-w-prose text-body-lg text-mute">{t("booking.page.subhead")}</p>
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

        {/* Help line — fall-back path for hesitant users */}
        {settings?.phone && (
          <div className="mt-16 border-t border-line pt-8 text-center">
            <p className="text-[13px] text-mute">
              {pickT(t, "booking.help.heading", "Brauchen Sie Hilfe bei der Buchung?")}
            </p>
            <a
              href={toTelHref(settings.phone)}
              className="mt-2 inline-flex items-center gap-2 text-[15px] font-medium text-ink transition-colors hover:text-gold-deep"
            >
              <Phone className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
              <span className="tabular-nums">{settings.phone}</span>
            </a>
          </div>
        )}

        <span className="sr-only">{draft ? "" : ""}</span>
      </div>
    </Container>
  );
}
