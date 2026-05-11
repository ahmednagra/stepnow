// apps/frontend/src/components/features/about/ServiceAreaMap.tsx
// Phase 3d polish — eyebrow + serif heading + premium-framed map.

"use client";

import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { Container, EmptyState, LeafletMap, type LeafletMarker } from "@/components/shared";

interface ServiceAreaMapProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ServiceAreaMap({ t, settings }: ServiceAreaMapProps) {
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  return (
    <section className="border-t border-line bg-paper">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <p className="label-eyebrow">{t("about.area.eyebrow") || "Einsatzgebiet"}</p>
          <h2 className="mt-3 font-serif text-section">{t("about.area.heading")}</h2>
          <p className="mt-4 text-body-lg text-mute">{t("about.area.body")}</p>
        </header>
        {hasCoords ? (
          <div className="border border-line bg-cream">
            <LeafletMap
              markers={
                [
                  {
                    lat,
                    lng,
                    label: settings.business_name,
                  },
                ] satisfies LeafletMarker[]
              }
              center={[lat, lng]}
              zoom={11}
              className="h-[460px]"
            />
          </div>
        ) : (
          <EmptyState
            title={t("about.area.empty.title") || "Karte nicht verfügbar"}
            description={t("about.area.empty.body") || "Standort wird in Kürze hinterlegt."}
          />
        )}
      </Container>
    </section>
  );
}
