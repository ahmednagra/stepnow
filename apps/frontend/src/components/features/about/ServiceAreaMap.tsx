// apps/frontend/src/components/features/about/ServiceAreaMap.tsx
// About-page service-area map: Google Maps after consent, OpenStreetMap fallback before.
"use client";
import { memo, useMemo } from "react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { EmptyState, GoogleMapsEmbed } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface ServiceAreaMapProps { settings: SettingsPublic }

function ServiceAreaMapImpl({ settings }: ServiceAreaMapProps) {
  const { t, locale } = useUiStrings();
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const osmHref = useMemo(
    () => hasCoords ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}` : null,
    [hasCoords, lat, lng],
  );

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
        {pickT(t, "about.area.eyebrow", locale === "de" ? "Einsatzgebiet" : "Service area")}
      </p>
      <h2 className="mt-1 mb-4 font-serif text-[24px] leading-tight tracking-tight md:text-[26px]">
        {pickT(t, "about.area.heading", locale === "de" ? "Wo wir fahren" : "Where we operate")}
      </h2>

      {hasCoords ? (
        <div className="relative h-[240px] border border-line bg-cream">
          <GoogleMapsEmbed lat={lat} lng={lng} label={settings.business_name} zoom={12} fallbackZoom={11} className="h-full" />
          {osmHref && (
            <a href={osmHref} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 left-2 z-[400] bg-ink/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors duration-base hover:bg-ink">
              {pickT(t, "about.area.open_external", locale === "de" ? "In Karten öffnen" : "Open in maps")} ↗
            </a>
          )}
        </div>
      ) : (
        <EmptyState
          title={pickT(t, "about.area.empty.title", locale === "de" ? "Karte nicht verfügbar" : "Map not available")}
          description={pickT(t, "about.area.empty.body", locale === "de" ? "Standort wird in Kürze hinterlegt." : "Location will be added soon.")}
        />
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-mute">
        {pickT(t, "about.area.body", locale === "de"
          ? "Wir fahren in der Region Stuttgart, Esslingen und im mittleren Neckartal."
          : "We operate in the Stuttgart, Esslingen and central Neckar valley region."
        )}
      </p>
    </div>
  );
}

export const ServiceAreaMap = memo(ServiceAreaMapImpl, (p, n) =>
  p.settings.address_lat === n.settings.address_lat &&
  p.settings.address_lng === n.settings.address_lng &&
  p.settings.business_name === n.settings.business_name
);
