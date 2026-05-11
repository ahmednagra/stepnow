// src/components/features/contact/ContactMethods.tsx
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";

interface ContactMethodsProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ContactMethods({ t, settings }: ContactMethodsProps) {
  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      <li>
        <a
          href={toTelHref(settings.phone)}
          className="flex items-start gap-4 py-5 transition-colors duration-base hover:text-gold-dark"
        >
          <Phone className="mt-1 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="label-eyebrow">{t("contact.method.phone")}</span>
            <span className="mt-1 font-serif text-lg">{settings.phone}</span>
            <span className="text-sm text-mute">{settings.opening_hours}</span>
          </div>
        </a>
      </li>
      <li>
        <a
          href={`mailto:${settings.email}`}
          className="flex items-start gap-4 py-5 transition-colors duration-base hover:text-gold-dark"
        >
          <Mail className="mt-1 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="label-eyebrow">{t("contact.method.email")}</span>
            <span className="mt-1 font-serif text-lg">{settings.email}</span>
          </div>
        </a>
      </li>
      {settings.whatsapp_url && (
        <li>
          <a
            href={settings.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 py-5 transition-colors duration-base hover:text-gold-dark"
          >
            <MessageCircle
              className="mt-1 h-5 w-5 shrink-0 text-gold-dark"
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="label-eyebrow">{t("contact.method.whatsapp")}</span>
              <span className="mt-1 font-serif text-lg">WhatsApp</span>
            </div>
          </a>
        </li>
      )}
      <li className="flex items-start gap-4 py-5">
        <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="label-eyebrow">{t("contact.method.address")}</span>
          <address className="mt-1 not-italic font-serif text-lg leading-tight">
            {settings.address_street}
            <br />
            {settings.address_postcode} {settings.address_city}
          </address>
        </div>
      </li>
    </ul>
  );
}
