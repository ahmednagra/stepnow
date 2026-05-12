// apps/frontend/src/components/features/about/Credentials.tsx
// Option A layout — compact credentials list. Tighter padding and 32px icons
// to fit in the 7-col left side of Row 2 alongside the map. Pulls dynamic
// concession line from site_settings when present.

import { Award, ShieldCheck, FileCheck, BadgeCheck } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { pickT } from "@/lib/i18n/pick";

interface CredentialsProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

interface CredentialItem {
  Icon: typeof Award;
  titleKey: string;
  bodyKey: string;
  defaults: { de: { title: string; body: string }; en: { title: string; body: string } };
  bodyOverride?: string | null;
}

export function Credentials({ t, settings, locale }: CredentialsProps) {
  const concessionLine = settings.concession_number
    ? locale === "de"
      ? `Lizenz-Nr. ${settings.concession_number}${
          settings.concession_authority ? ` · erteilt durch ${settings.concession_authority}` : ""
        }`
      : `License No. ${settings.concession_number}${
          settings.concession_authority ? ` · issued by ${settings.concession_authority}` : ""
        }`
    : null;

  const ITEMS: CredentialItem[] = [
    {
      Icon: Award,
      titleKey: "about.credentials.pbefg.title",
      bodyKey: "about.credentials.pbefg.body",
      defaults: {
        de: {
          title: "Konzession nach § 49 PBefG",
          body: "Lizenziert nach dem deutschen Personenbeförderungsgesetz. Volle Konzessionspflicht erfüllt.",
        },
        en: {
          title: "License under § 49 PBefG",
          body: "Licensed under the German Passenger Transport Act. Full concession compliance.",
        },
      },
      bodyOverride: concessionLine,
    },
    {
      Icon: BadgeCheck,
      titleKey: "about.credentials.bkrfqg.title",
      bodyKey: "about.credentials.bkrfqg.body",
      defaults: {
        de: { title: "Berufskraftfahrer-Qualifikation", body: "Qualifikation nach BKrFQG mit regelmäßigen Weiterbildungen." },
        en: { title: "Professional driver qualification", body: "BKrFQG-certified with regular continuing education." },
      },
    },
    {
      Icon: ShieldCheck,
      titleKey: "about.credentials.insurance.title",
      bodyKey: "about.credentials.insurance.body",
      defaults: {
        de: { title: "Personenbeförderungs-Haftpflicht", body: "Volle Personenbeförderungs-Haftpflichtversicherung für alle Fahrten." },
        en: { title: "Passenger transport liability", body: "Full passenger transport liability insurance on every ride." },
      },
    },
    {
      Icon: FileCheck,
      titleKey: "about.credentials.handelsregister.title",
      bodyKey: "about.credentials.handelsregister.body",
      defaults: {
        de: { title: "Eintrag im Handelsregister", body: "Eingetragenes Unternehmen am Amtsgericht — Geschäftssitz Deizisau." },
        en: { title: "Trade register entry", body: "Registered business at the local commercial court — based in Deizisau." },
      },
    },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
        {pickT(t, "about.credentials.eyebrow", locale === "de" ? "Qualifikationen" : "Credentials")}
      </p>
      <h2 className="mt-1 mb-4 font-serif text-[24px] leading-tight tracking-tight md:text-[26px]">
        {pickT(
          t,
          "about.credentials.heading",
          locale === "de" ? "Qualifikationen & Lizenzen" : "Credentials & licenses",
        )}
      </h2>
      <ul className="border-y border-line">
        {ITEMS.map((it) => {
          const title = pickT(t, it.titleKey, it.defaults[locale].title);
          const body = it.bodyOverride ?? pickT(t, it.bodyKey, it.defaults[locale].body);
          return (
            <li
              key={it.titleKey}
              className="flex items-start gap-4 border-b border-line py-3.5 last:border-b-0"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
                <it.Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-[14.5px] font-semibold tracking-tight text-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-mute">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
