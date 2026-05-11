// apps/frontend/src/components/features/contact/ContactMethods.tsx
// Phase 3d polish — refined contact tiles with hairlines, gold-deep icons,
// and an opening-hours block beneath the address tile.

import { Phone, Mail, MapPin, Clock3 } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";

interface ContactMethodsProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ContactMethods({ t, settings }: ContactMethodsProps) {
  return (
    <ul className="flex flex-col gap-px bg-line">
      {/* Phone */}
      <li className="bg-cream">
        <a
          href={toTelHref(settings.phone)}
          className="flex items-start gap-5 p-6 transition-colors duration-base hover:bg-paper"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <Phone className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
              {t("contact.method.phone") || "Telefon"}
            </p>
            <p className="mt-1 font-serif text-xl tracking-tight tabular-nums text-ink">
              {settings.phone}
            </p>
            {settings.opening_hours_phone && (
              <p className="mt-1 text-[13px] text-mute">{settings.opening_hours_phone}</p>
            )}
          </div>
        </a>
      </li>
      {/* Email */}
      <li className="bg-cream">
        <a
          href={`mailto:${settings.email}`}
          className="flex items-start gap-5 p-6 transition-colors duration-base hover:bg-paper"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <Mail className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
              {t("contact.method.email") || "E-Mail"}
            </p>
            <p className="mt-1 break-all font-serif text-xl tracking-tight text-ink">
              {settings.email}
            </p>
          </div>
        </a>
      </li>
      {/* Address */}
      <li className="bg-cream">
        <div className="flex items-start gap-5 p-6">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <MapPin className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
              {t("contact.method.address") || "Adresse"}
            </p>
            <address className="mt-1 not-italic font-serif text-lg leading-snug tracking-tight text-ink">
              {settings.address_street}
              <br />
              {settings.address_postcode} {settings.address_city}
            </address>
          </div>
        </div>
      </li>
      {/* Opening hours */}
      {settings.opening_hours_rides && (
        <li className="bg-cream">
          <div className="flex items-start gap-5 p-6">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
              <Clock3 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
                {t("contact.method.hours") || "Fahrzeiten"}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">
                {settings.opening_hours_rides}
              </p>
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}
