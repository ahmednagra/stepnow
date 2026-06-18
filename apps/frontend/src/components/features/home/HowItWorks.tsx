import { ArrowRight, Car, CheckCircle, ClipboardList } from "lucide-react";
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
    <section className="border-y border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] shadow-premium">
          <div className="grid gap-8 border-b border-[color:var(--color-border-soft)] px-6 py-7 md:px-8 md:py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "home.how.pre_heading", "Ablauf")}
              </p>
              <h2 className="mt-3 max-w-2xl font-serif text-section text-[var(--color-text-primary)] md:text-display-md">
                {t("home.how.heading")}
              </h2>
              <span className="accent-rule mt-5" aria-hidden="true" />
            </div>

            <div className="flex items-start gap-3 lg:max-w-sm lg:justify-self-end">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "home.how.summary",
                  "Kurze Anfrage, klare Rueckmeldung und planbare Fahrt. Ohne unnötige Zwischenschritte.",
                )}
              </p>
            </div>
          </div>

          <ol className="grid gap-px bg-[color:var(--color-border-soft)] md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="bg-[var(--color-bg-surface)]">
                <article className="flex h-full flex-col p-6 md:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-serif text-[40px] leading-none tracking-tight text-[color:rgba(168,134,90,0.34)] md:text-[56px]">
                      {step.number}
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                      <step.Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-8 border-t border-[color:var(--color-border-soft)] pt-5">
                    <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[24px]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                      {step.body}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
