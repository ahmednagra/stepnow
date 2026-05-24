// apps/frontend/src/components/features/home/TrustStrip.tsx
// Four-icon credentials strip beneath the hero — light surface, hairline rule.

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
      className="border-b border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]"
    >
      <Container className="grid grid-cols-2 gap-x-6 gap-y-6 py-5 md:grid-cols-4 md:gap-x-10 md:py-6">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]"
            >
              <Icon strokeWidth={1.25} className="h-5 w-5" />
            </span>
            <span className="text-[13.5px] leading-snug text-[var(--color-text-primary)] md:text-[14px]">
              {t(key)}
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}
