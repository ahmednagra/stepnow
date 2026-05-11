// src/components/features/booking/ConfirmationView.tsx
import Link from "next/link";
import { Check, Phone } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { toTelHref } from "@/utils/formatters";

interface ConfirmationViewProps {
  t: TFunction;
  locale: Locale;
  reference: string;
  settings: SettingsPublic;
}

export function ConfirmationView({ t, locale, reference, settings }: ConfirmationViewProps) {
  const homeHref = locale === "de" ? "/" : "/en";

  return (
    <Container className="py-section">
      <div className="mx-auto max-w-2xl">
        {/* Success block */}
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <Check className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
          </span>
          <h1 className="font-serif text-section md:text-hero">
            {t("booking.confirmation.heading")}
          </h1>
        </div>

        {/* Reference */}
        <div className="mt-12 flex flex-col items-center gap-2 border border-line bg-cream p-8 text-center">
          <p className="label-eyebrow">{t("booking.confirmation.reference_label")}</p>
          <p className="font-serif text-3xl tracking-tight md:text-4xl">{reference}</p>
        </div>

        {/* Next steps */}
        <section className="mt-16">
          <h2 className="font-serif text-xl tracking-tight">
            {t("booking.confirmation.next_steps_heading")}
          </h2>
          <ol className="mt-6 flex flex-col gap-4">
            {[
              t("booking.confirmation.next_step_1"),
              t("booking.confirmation.next_step_2"),
              t("booking.confirmation.next_step_3"),
            ].map((step, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-gold/40 font-serif text-sm text-gold-dark">
                  {idx + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-ink/85">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Urgent fallback */}
        <section className="mt-12 border-t border-line pt-10">
          <h2 className="label-eyebrow">{t("booking.confirmation.urgent_heading")}</h2>
          <p className="mt-3 text-mute">{t("booking.confirmation.urgent_body")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={toTelHref(settings.phone)}>
              <Button
                size="lg"
                variant="primary"
                leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
              >
                {settings.phone}
              </Button>
            </a>
            <Link href={homeHref}>
              <Button size="lg" variant="ghost">
                {t("booking.confirmation.cta_home")}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}
