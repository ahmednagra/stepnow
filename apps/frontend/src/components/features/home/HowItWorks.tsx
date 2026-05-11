// apps/frontend/src/components/features/home/HowItWorks.tsx
// Phase 3d polish — addresses audit §11.2 (larger gold serif numerals,
// hairline accents). Steps now sit beneath a vertical 1px hairline that
// connects to the gold numeral — feels like a hand-drawn diagram.

import { ClipboardList, CheckCircle, Car } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface HowItWorksProps {
  t: TFunction;
}

interface Step {
  number: string;
  title: string;
  body: string;
  Icon: typeof ClipboardList;
}

export function HowItWorks({ t }: HowItWorksProps) {
  const steps: Step[] = [
    {
      number: "01",
      title: t("home.how.step1.title"),
      body: t("home.how.step1.body"),
      Icon: ClipboardList,
    },
    {
      number: "02",
      title: t("home.how.step2.title"),
      body: t("home.how.step2.body"),
      Icon: CheckCircle,
    },
    {
      number: "03",
      title: t("home.how.step3.title"),
      body: t("home.how.step3.body"),
      Icon: Car,
    },
  ];

  return (
    <section className="bg-cream">
      <Container className="py-section">
        <header className="mb-16 max-w-3xl">
          <p className="label-eyebrow">{pickT(t, "home.how.pre_heading", "Ablauf")}</p>
          <h2 className="mt-3 font-serif text-section md:text-display-md">
            {t("home.how.heading")}
          </h2>
        </header>
        <ol className="grid gap-12 md:grid-cols-3 md:gap-10">
          {steps.map((step) => (
            <li key={step.number} className="flex flex-col">
              {/* Gold serif numeral */}
              <span
                aria-hidden="true"
                className="font-serif text-[5rem] leading-none text-gold"
              >
                {step.number}
              </span>
              {/* Hairline below the numeral */}
              <span aria-hidden="true" className="mt-4 h-px w-12 bg-gold/50" />
              {/* Icon — subtle */}
              <span
                aria-hidden="true"
                className="mt-6 inline-flex h-9 w-9 items-center justify-center border border-line text-mute"
              >
                <step.Icon className="h-4 w-4" strokeWidth={1.25} />
              </span>
              <h3 className="mt-6 font-serif text-xl tracking-tight text-ink md:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-mute">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
