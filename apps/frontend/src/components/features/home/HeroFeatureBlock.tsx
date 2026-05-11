// src/components/features/home/HeroFeatureBlock.tsx
import { Plane, HeartPulse, GraduationCap, Users } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { BrandMark } from "@/components/shared";

interface HeroFeatureBlockProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

const SERVICES = [
  { icon: Plane, key: "services.flughafentransfer" },
  { icon: HeartPulse, key: "services.krankenhausfahrten" },
  { icon: GraduationCap, key: "services.schuelerbefoerderung" },
  { icon: Users, key: "services.shuttle" },
];

/**
 * Typographic feature block for the right side of the hero. Designed to feel
 * intentional and considered rather than photo-placeholder. Composed of:
 *   - A large BrandMark
 *   - Concession credential (the legal/regulatory proof point)
 *   - Service categories as thin-stroke icons + labels (browsable preview)
 *
 * Sits in a thin-bordered frame to give the right side weight without a photo.
 */
export function HeroFeatureBlock({ t, settings, locale }: HeroFeatureBlockProps) {
  return (
    <div className="relative border border-cream/12 bg-charcoal/30 p-10 md:p-12">
      {/* Brand mark in the corner */}
      <BrandMark size={48} className="text-cream/85" />

      {/* Concession credential */}
      {settings.concession_number && (
        <div className="mt-12 flex flex-col gap-2 border-l border-gold/60 pl-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {locale === "de" ? "Konzessioniert nach" : "Licensed under"}
          </p>
          <p className="font-serif text-2xl tracking-tight text-cream">
            § 49 PBefG
          </p>
          <p className="text-sm text-cream/55">{settings.concession_number}</p>
        </div>
      )}

      {/* Service grid */}
      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5">
        {SERVICES.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-start gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-gold"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            <span className="text-[13px] leading-snug text-cream/85">{t(key)}</span>
          </div>
        ))}
      </div>

      {/* Locality */}
      <p className="mt-10 border-t border-cream/10 pt-6 text-[11px] uppercase tracking-[0.22em] text-cream/45">
        {locale === "de" ? "Region" : "Service area"} ·{" "}
        <span className="text-cream/70">Stuttgart · Esslingen · Deizisau</span>
      </p>
    </div>
  );
}
