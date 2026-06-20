import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface ProcessStep {
  number: string | number;
  title: string;
  body: string;
  icon?: ReactNode;
}

interface ProcessStepsProps {
  steps: ProcessStep[];
  tone?: "dark" | "light";
  className?: string;
}

export function ProcessSteps({ steps, tone = "light", className }: ProcessStepsProps) {
  return (
    <ol className={cn("grid gap-8 md:grid-cols-3 md:gap-8", className)}>
      {steps.map((step) => (
        <li key={String(step.number)} className="flex flex-col">
          <span
            aria-hidden="true"
            className={cn(
              "font-serif text-[4.5rem] leading-none",
              tone === "dark" ? "text-gold-light" : "text-gold",
            )}
          >
            {step.number}
          </span>
          <span
            aria-hidden="true"
            className={cn("mt-3 h-px w-12", tone === "dark" ? "bg-gold/40" : "bg-gold/50")}
          />
          {step.icon && (
            <span
              className={cn(
                "mt-5 inline-flex h-9 w-9 items-center justify-center border",
                tone === "dark" ? "border-cream/20 text-cream/70" : "border-line text-mute",
              )}
            >
              {step.icon}
            </span>
          )}
          <h3
            className={cn(
              "mt-5 text-[19px] font-semibold tracking-tight md:text-[21px]",
              tone === "dark" ? "text-cream" : "text-ink",
            )}
          >
            {step.title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-xs text-[15px] leading-relaxed",
              tone === "dark" ? "text-cream/70" : "text-mute",
            )}
          >
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
