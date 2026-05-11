// src/components/features/home/TrustStrip.tsx
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

/**
 * Refined credentials row. Thin-stroke icons (strokeWidth=1.25), more generous
 * spacing, smaller more uppercase-feeling labels — feels like a press list,
 * not a checklist.
 */
export function TrustStrip({ t }: TrustStripProps) {
  return (
    <section aria-label={t("home.trust.licensed")} className="border-b border-line bg-cream">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-14 md:grid-cols-4 md:py-16">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="flex items-start gap-4">
            <Icon
              aria-hidden="true"
              strokeWidth={1.25}
              className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
            />
            <span className="text-[14px] leading-snug text-ink/85">{t(key)}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
