// apps/frontend/src/components/features/home/WhyStepNow.tsx
// Two-column differentiators — editorial pull-out with gold numerals.

import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

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
    <section className="border-t border-line bg-paper">
      <Container className="grid gap-8 py-section md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <p className="label-eyebrow">{pickT(t, "home.why.pre_heading", "Differenzierung")}</p>
          <h2 className="mt-2 font-serif text-section">{t("home.why.heading")}</h2>
          <p className="mt-3 max-w-prose text-body-lg text-mute">{t("home.why.intro")}</p>
        </div>
        <ul className="divide-y divide-line border-y border-line md:col-span-7">
          {BULLETS.map((key, idx) => {
            const text = t(key);
            const [lead, rest] = text.includes("—")
              ? [text.split("—")[0]?.trim() ?? "", text.split("—").slice(1).join("—").trim()]
              : [text, ""];
            return (
              <li key={key} className="flex items-start gap-5 py-4">
                <span aria-hidden="true" className="font-serif text-xl tabular-nums text-gold-deep">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className="font-medium tracking-tight text-ink">{lead}</p>
                  {rest && <p className="mt-1 text-[14.5px] leading-relaxed text-mute">{rest}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
