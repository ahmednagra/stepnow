// apps/frontend/src/components/features/contact/ContactMethods.tsx

import { Phone, Mail, MapPin } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

interface ContactMethodsProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ContactMethods({ t, settings }: ContactMethodsProps) {
  return (
    <ul className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
      {/* Phone */}
      <li className="bg-[var(--color-bg-page)]">
        <a
          href={toTelHref(settings.phone)}
          className="flex items-start gap-4 p-5 transition-colors duration-base hover:bg-[var(--color-bg-surface)]"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)]">
            <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {pickT(t, "contact.method.phone", "Telefon")}
            </p>
            <p className="mt-1 font-serif text-[17px] leading-snug tracking-tight tabular-nums text-[var(--color-text-primary)]">
              {settings.phone}
            </p>
            {settings.opening_hours && (
              <p className="mt-1 text-[11.5px] leading-tight text-[var(--color-text-secondary)]">
                {settings.opening_hours}
              </p>
            )}
          </div>
        </a>
      </li>

      {/* WhatsApp */}
      {settings.whatsapp_url && (
        <li className="bg-[var(--color-bg-page)]">
          <a
            href={settings.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-5 transition-colors duration-base hover:bg-[var(--color-bg-surface)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)]">
              <WhatsAppIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                {pickT(t, "contact.method.whatsapp", "WhatsApp")}
              </p>
              <p className="mt-1 font-serif text-[17px] leading-snug tracking-tight tabular-nums text-[var(--color-text-primary)]">
                {settings.phone}
              </p>
            </div>
          </a>
        </li>
      )}

      {/* Email */}
      <li className="bg-[var(--color-bg-page)]">
        <a
          href={`mailto:${settings.email}`}
          className="flex items-start gap-4 p-5 transition-colors duration-base hover:bg-[var(--color-bg-surface)]"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)]">
            <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {pickT(t, "contact.method.email", "E-Mail")}
            </p>
            <p className="mt-1 break-all font-serif text-[15px] leading-snug tracking-tight text-[var(--color-text-primary)]">
              {settings.email}
            </p>
          </div>
        </a>
      </li>

      {/* Address */}
      <li className="bg-[var(--color-bg-page)]">
        <div className="flex items-start gap-4 p-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)]">
            <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {pickT(t, "contact.method.address", "Adresse")}
            </p>
            <address className="mt-1 not-italic font-serif text-[14.5px] leading-snug tracking-tight text-[var(--color-text-primary)]">
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
