// src/components/features/home/HowItWorks.tsx
import { ClipboardList, CheckCircle, Car } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Container, ProcessSteps, type ProcessStep } from "@/components/shared";

interface HowItWorksProps {
  t: TFunction;
}

export function HowItWorks({ t }: HowItWorksProps) {
  const steps: ProcessStep[] = [
    {
      number: "01",
      title: t("home.how.step1.title"),
      body: t("home.how.step1.body"),
      icon: <ClipboardList aria-hidden="true" className="h-6 w-6 text-mute" />,
    },
    {
      number: "02",
      title: t("home.how.step2.title"),
      body: t("home.how.step2.body"),
      icon: <CheckCircle aria-hidden="true" className="h-6 w-6 text-mute" />,
    },
    {
      number: "03",
      title: t("home.how.step3.title"),
      body: t("home.how.step3.body"),
      icon: <Car aria-hidden="true" className="h-6 w-6 text-mute" />,
    },
  ];

  return (
    <section className="bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <h2 className="font-serif text-section">{t("home.how.heading")}</h2>
        </header>
        <ProcessSteps steps={steps} tone="dark" />
      </Container>
    </section>
  );
}
