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
      <Container className="py-10 md:py-12">
        <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
          <div className="grid gap-5 border-b border-[color:var(--color-border-soft)] px-6 py-5 md:px-7 md:py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "home.how.pre_heading", "Ablauf")}
              </p>
              <h2 className="mt-1.5 font-serif text-[26px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
                {t("home.how.heading")}
              </h2>
            </div>

            <div className="flex items-start gap-3 lg:max-w-sm lg:justify-self-end">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "home.how.summary",
                  "Kurze Anfrage, klare Rueckmeldung und planbare Fahrt. Ohne unnötige Zwischenschritte.",
                )}
              </p>
            </div>
          </div>

          <ol className="grid divide-y divide-dashed divide-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((step) => (
              <li key={step.number}>
                <article className="flex h-full flex-col p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.1em] text-[var(--color-accent-primary)] tabular-nums">
                      N&deg; {step.number}/{String(steps.length).padStart(2, "0")}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                      <step.Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-4 border-t border-dashed border-[color:var(--color-border-soft)] pt-4">
                    <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
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
