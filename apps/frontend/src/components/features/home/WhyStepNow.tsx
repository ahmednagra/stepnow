// src/components/features/home/WhyStepNow.tsx
import { Check } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";

interface WhyStepNowProps {
  t: TFunction;
}

const BULLETS = [
  "home.why.bullet.fixed_price",
  "home.why.bullet.prebooked",
  "home.why.bullet.licensed",
  "home.why.bullet.personal",
  "home.why.bullet.regional",
];

export function WhyStepNow({ t }: WhyStepNowProps) {
  return (
    <section className="border-t border-line bg-cream">
      <Container className="grid gap-12 py-section md:grid-cols-2">
        <div>
          <h2 className="font-serif text-section">{t("home.why.heading")}</h2>
          <p className="mt-4 max-w-prose text-body-lg text-mute">{t("home.why.intro")}</p>
        </div>
        <ul className="flex flex-col gap-4">
          {BULLETS.map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] leading-relaxed text-ink">{t(key)}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
