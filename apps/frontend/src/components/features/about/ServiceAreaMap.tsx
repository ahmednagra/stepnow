// apps/frontend/src/components/features/about/ServiceAreaMap.tsx
// Option A layout — compact map block for the 5-col right side of Row 2.
// Renders just the eyebrow + heading + map + coverage line + city list.
// The parent page (about) wraps it in the layout grid.

"use client";

import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { EmptyState, LeafletMap, type LeafletMarker } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface ServiceAreaMapProps {
  settings: SettingsPublic;
}

const CITIES_DE = "Deizisau · Esslingen · Stuttgart · Plochingen · Wendlingen · Kirchheim";
const CITIES_EN = "Deizisau · Esslingen · Stuttgart · Plochingen · Wendlingen · Kirchheim";

export function ServiceAreaMap({ settings }: ServiceAreaMapProps) {
  const { t, locale } = useUiStrings();
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  const osmHref = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`
    : null;

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
          <LeafletMap
            markers={[{ lat, lng, label: settings.business_name } satisfies LeafletMarker]}
            center={[lat, lng]}
            zoom={11}
            className="h-full"
          />
          {osmHref && (
            <a
              href={osmHref}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-2 z-[400] bg-ink/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors duration-base hover:bg-ink"
            >
              {pickT(t, "about.area.open_external", locale === "de" ? "In Karten öffnen" : "Open in maps")} ↗
            </a>
          )}
        </div>
      ) : (
        <EmptyState
          title={pickT(
            t,
            "about.area.empty.title",
            locale === "de" ? "Karte nicht verfügbar" : "Map not available",
          )}
          description={pickT(
            t,
            "about.area.empty.body",
            locale === "de" ? "Standort wird in Kürze hinterlegt." : "Location will be added soon.",
          )}
        />
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-mute">
        {pickT(
          t,
          "about.area.body",
          locale === "de"
            ? "Sitz in Deizisau · Bedienung im Umkreis von ca. 50 km, mit täglichen Routen zum Stuttgart Flughafen und zu regionalen Kliniken."
            : "Based in Deizisau · ride coverage within ~50 km, with daily routes to Stuttgart Airport and regional hospitals.",
        )}
      </p>
      <p className="mt-2 font-serif text-[15px] leading-snug tracking-tight text-ink">
        {pickT(t, "about.area.cities", locale === "de" ? CITIES_DE : CITIES_EN)}
      </p>
    </div>
  );
}
