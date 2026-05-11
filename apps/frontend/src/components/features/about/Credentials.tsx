// apps/frontend/src/components/features/about/Credentials.tsx
// Phase 3d polish — credential rows with gold-deep eyebrows and tabular-nums
// reference values. Hidden cleanly when no concession data is configured.

import { Award, ShieldCheck, FileCheck, BadgeCheck } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";

interface CredentialsProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

export function Credentials({ t, settings }: CredentialsProps) {
  // If no concession info is set yet, we still render the credentials block
  // because BKrFQG / insurance entries don't require concession data.

  const concessionLine = settings.concession_number
    ? locale === "de"
      ? `Lizenz-Nr. ${settings.concession_number}${
          settings.concession_authority ? ` · erteilt durch ${settings.concession_authority}` : ""
        }`
      : `License No. ${settings.concession_number}${
          settings.concession_authority ? ` · issued by ${settings.concession_authority}` : ""
        }`
    : null;

  const ITEMS = [
    {
      Icon: Award,
      titleKey: "about.credentials.pbefg.title",
      defaultTitle: locale === "de" ? "Konzession nach § 49 PBefG" : "License under § 49 PBefG",
      body: concessionLine ?? t("about.credentials.pbefg.body"),
    },
    {
      Icon: BadgeCheck,
      titleKey: "about.credentials.bkrfqg.title",
      defaultTitle:
        locale === "de"
          ? "Berufskraftfahrer-Qualifikation"
          : "Professional driver qualification",
      body: t("about.credentials.bkrfqg.body"),
    },
    {
      Icon: ShieldCheck,
      titleKey: "about.credentials.insurance.title",
      defaultTitle:
        locale === "de"
          ? "Personenbeförderungs-Haftpflicht"
          : "Passenger transport liability",
      body: t("about.credentials.insurance.body"),
    },
    {
      Icon: FileCheck,
      titleKey: "about.credentials.handelsregister.title",
      defaultTitle:
        locale === "de" ? "Eintrag im Handelsregister" : "Trade register entry",
      body: t("about.credentials.handelsregister.body"),
    },
  ];

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <p className="label-eyebrow">
            {t("about.credentials.eyebrow") || "Qualifikationen"}
          </p>
          <h2 className="mt-3 font-serif text-section">{t("about.credentials.heading")}</h2>
        </header>
        <ul className="divide-y divide-line border-y border-line">
          {ITEMS.map((it) => {
            const body = it.body;
            // Skip rows that have no body content (no fallback strings either)
            if (!body || body.startsWith("[")) return null;
            return (
              <li key={it.titleKey} className="flex items-start gap-5 py-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 text-gold-deep">
                  <it.Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="font-serif text-lg tracking-tight text-ink">
                    {(() => {
                      const fromString = t(it.titleKey);
                      return fromString && !fromString.startsWith("[") ? fromString : it.defaultTitle;
                    })()}
                  </p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-mute">{body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
