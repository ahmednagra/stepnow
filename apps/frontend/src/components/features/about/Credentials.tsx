// src/components/features/about/Credentials.tsx
import { Award, ShieldCheck } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { formatDate } from "@/utils/formatters";

interface CredentialsProps {
  t: TFunction;
  settings: SettingsPublic;
  locale: Locale;
}

export function Credentials({ t, settings, locale }: CredentialsProps) {
  // Hide the section entirely if no concession data is configured yet.
  if (!settings.concession_number && !settings.concession_authority) return null;

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <h2 className="font-serif text-section">{t("about.credentials.heading")}</h2>
        </header>
        <ul className="grid gap-6 md:grid-cols-2">
          {settings.concession_number && (
            <li className="flex items-start gap-4 border border-line bg-cream p-6">
              <Award className="mt-1 h-6 w-6 shrink-0 text-gold-dark" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="label-eyebrow">PBefG § 49</p>
                <p className="font-serif text-xl">{settings.concession_number}</p>
                {settings.concession_authority && (
                  <p className="text-sm text-mute">{settings.concession_authority}</p>
                )}
                {settings.concession_date && (
                  <p className="text-sm text-mute">
                    {locale === "de" ? "Erteilt am" : "Issued"} {formatDate(settings.concession_date, locale)}
                  </p>
                )}
              </div>
            </li>
          )}
          <li className="flex items-start gap-4 border border-line bg-cream p-6">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-gold-dark" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="label-eyebrow">PBefG § 23</p>
              <p className="font-serif text-xl">
                {locale === "de" ? "Personenbeförderungs-Haftpflicht" : "Passenger transport liability"}
              </p>
              <p className="text-sm text-mute">
                {locale === "de"
                  ? "Volle Versicherungsdeckung für alle Fahrgäste."
                  : "Full insurance cover for every passenger."}
              </p>
            </div>
          </li>
        </ul>
      </Container>
    </section>
  );
}
