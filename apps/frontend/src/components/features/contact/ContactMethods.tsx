// apps/frontend/src/components/features/contact/ContactMethods.tsx

import { Phone, Mail, MapPin } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";

interface ContactMethodsProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ContactMethods({ t, settings }: ContactMethodsProps) {
  return (
    <ul className="flex flex-col gap-px border border-line bg-line">
      {/* Phone */}
      <li className="bg-cream">
        <a
          href={toTelHref(settings.phone)}
          className="flex items-start gap-3 p-3.5 transition-colors duration-base hover:bg-paper"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
              {pickT(t, "contact.method.phone", "Telefon")}
            </p>
            <p className="mt-0.5 font-serif text-[16px] leading-snug tracking-tight tabular-nums text-ink">
              {settings.phone}
            </p>
            {settings.opening_hours && (
              <p className="mt-0.5 text-[11.5px] leading-tight text-mute">
                {settings.opening_hours}
              </p>
            )}
          </div>
        </a>
      </li>

      {/* Email */}
      <li className="bg-cream">
        <a
          href={`mailto:${settings.email}`}
          className="flex items-start gap-3 p-3.5 transition-colors duration-base hover:bg-paper"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
              {pickT(t, "contact.method.email", "E-Mail")}
            </p>
            <p className="mt-0.5 break-all font-serif text-[15px] leading-snug tracking-tight text-ink">
              {settings.email}
            </p>
          </div>
        </a>
      </li>

      {/* Address */}
      <li className="bg-cream">
        <div className="flex items-start gap-3 p-3.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
            <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
              {pickT(t, "contact.method.address", "Adresse")}
            </p>
            <address className="mt-0.5 not-italic font-serif text-[14.5px] leading-snug tracking-tight text-ink">
              {settings.address_street}
              <br />
              {settings.address_postcode} {settings.address_city}
            </address>
          </div>
        </div>
      </li>
    </ul>
  );
}
