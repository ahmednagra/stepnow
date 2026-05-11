// apps/frontend/src/components/features/home/TrustStrip.tsx
// Phase 3d polish — addresses audit H-4.
//   • Hairline rules now bookend the strip on top and bottom.
//   • Icons centered with labels, larger touch targets on mobile.
//   • Generous vertical breathing room — the strip should feel like a
//     small "press credentials" block, not a bulleted list.

import { Award, BadgeEuro, ShieldCheck, Clock3 } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import { Container } from "@/components/shared";

interface TrustStripProps {
  t: TFunction;
}

const ITEMS = [
  { key: "home.trust.licensed", Icon: Award },
  { key: "home.trust.fixed_price", Icon: BadgeEuro },
  { key: "home.trust.drivers", Icon: ShieldCheck },
  { key: "home.trust.always_available", Icon: Clock3 },
];

export function TrustStrip({ t }: TrustStripProps) {
  return (
    <section
      aria-label={t("home.trust.licensed")}
      className="border-y border-line bg-paper"
    >
      <Container className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-4 md:gap-x-10 md:py-16">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep"
            >
              <Icon strokeWidth={1.25} className="h-5 w-5" />
            </span>
            <span className="text-[13.5px] leading-snug text-ink/85 md:text-[14px]">
              {t(key)}
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}
