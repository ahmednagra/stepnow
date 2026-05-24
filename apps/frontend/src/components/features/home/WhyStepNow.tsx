import Image from "next/image";
import { BadgeCheck, MapPinned, PhoneCall, ShieldCheck, WalletCards } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface WhyStepNowProps {
  t: TFunction;
}

interface Benefit {
  key: string;
  Icon: typeof BadgeCheck;
}

const BENEFITS: Benefit[] = [
  { key: "home.why.bullet.fixed_price", Icon: WalletCards },
  { key: "home.why.bullet.prebooked", Icon: BadgeCheck },
  { key: "home.why.bullet.licensed", Icon: ShieldCheck },
  { key: "home.why.bullet.personal", Icon: PhoneCall },
  { key: "home.why.bullet.regional", Icon: MapPinned },
];

const WHY_IMAGE =
  "https://images.unsplash.com/photo-1511527844068-006b95d162c2?auto=format&fit=crop&w=1600&q=80";

export function WhyStepNow({ t }: WhyStepNowProps) {
  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
          <div className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
            <div className="bg-[var(--color-bg-surface)] p-6 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "home.why.pre_heading", "Differenzierung")}
              </p>
              <h2 className="mt-3 max-w-lg font-serif text-section text-[var(--color-text-primary)] md:text-display-md">
                {t("home.why.heading")}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-secondary)] md:text-[16px]">
                {t("home.why.intro")}
              </p>
            </div>

            <div className="relative min-h-[280px] bg-[var(--color-bg-surface)] md:min-h-[360px]">
              <Image
                src={WHY_IMAGE}
                alt="Professional passenger transfer service"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.08),rgba(47,58,31,0.48))]" />
            </div>
          </div>

          <div className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
            {BENEFITS.map(({ key, Icon }) => {
              const text = t(key);
              const [lead, rest] = text.includes("—")
                ? [text.split("—")[0]?.trim() ?? "", text.split("—").slice(1).join("—").trim()]
                : [text, ""];

              return (
                <article
                  key={key}
                  className="grid gap-5 bg-[var(--color-bg-surface)] p-6 md:grid-cols-[auto_1fr] md:items-center md:gap-6 md:p-7"
                >
                  <div className="flex items-center gap-4 md:block">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] md:h-12 md:w-12">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="border-t border-[color:var(--color-border-soft)] pt-4 md:border-t-0 md:pt-0">
                    <h3 className="max-w-xl text-[20px] font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[22px]">
                      {lead}
                    </h3>
                    {rest && (
                      <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">
                        {rest}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
