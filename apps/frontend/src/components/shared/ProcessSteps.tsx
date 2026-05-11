// src/components/shared/ProcessSteps.tsx
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

/**
 * Generic 3-step (or N-step) process layout. Used on the homepage
 * "How it works" section and on service detail pages.
 */
export function ProcessSteps({ steps, tone = "dark", className }: ProcessStepsProps) {
  return (
    <ol
      className={cn(
        "grid gap-8 md:grid-cols-3",
        className,
      )}
    >
      {steps.map((step) => (
        <li key={String(step.number)} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "font-serif text-5xl leading-none",
                tone === "dark" ? "text-gold" : "text-gold-light",
              )}
              aria-hidden="true"
            >
              {step.number}
            </span>
            {step.icon && <span className="opacity-60">{step.icon}</span>}
          </div>
          <h3
            className={cn(
              "font-serif text-xl tracking-tight",
              tone === "dark" ? "text-ink" : "text-cream",
            )}
          >
            {step.title}
          </h3>
          <p
            className={cn(
              "leading-relaxed",
              tone === "dark" ? "text-mute" : "text-cream/70",
            )}
          >
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
