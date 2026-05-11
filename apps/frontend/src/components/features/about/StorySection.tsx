// src/components/features/about/StorySection.tsx
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { Container } from "@/components/shared";

interface StorySectionProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function StorySection({ t, settings }: StorySectionProps) {
  return (
    <section className="bg-cream">
      <Container className="grid gap-10 py-section md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="font-serif text-section">{t("about.story.heading")}</h2>
        </div>
        <div className="md:col-span-2">
          <div className="space-y-4 text-body-lg text-ink/85">
            <p>
              {settings.business_name} ist ein inhabergeführtes Mietwagen-Unternehmen mit Sitz in
              {" "}
              {settings.address_city}. Wir konzentrieren uns auf vorbestellte Fahrten zum Festpreis
              — keine Taxameter, keine Überraschungen.
            </p>
            <p>
              Als regionaler Partner kennen wir die Strecken zwischen Stuttgart, Esslingen und dem
              mittleren Neckartal aus dem Effeff. Unsere Fahrer sind geprüft, unsere Fahrzeuge
              gewartet, unsere Versicherung deckt jeden Personentransport gemäß § 23 PBefG ab.
            </p>
            <p>
              Persönlich erreichbar, persönlich verantwortlich. Inhaber {settings.owner_name}
              {" "}
              steht für jede Fahrt ein.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
