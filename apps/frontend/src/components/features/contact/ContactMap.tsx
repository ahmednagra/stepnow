// apps/frontend/src/components/features/contact/ContactMap.tsx
// Option A layout — `compact` mode renders a small sidebar thumbnail (~175px)
// with an "Open in maps" overlay link that opens the location in the user's
// default map app via the standard geo: / OpenStreetMap URL.
//
// The non-compact branch is kept for backward compatibility.

"use client";

import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { LeafletMap, type LeafletMarker } from "@/components/shared";
import { EmptyState } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface ContactMapProps {
  settings: SettingsPublic;
  /** Compact mode: small thumbnail for the sidebar, no address footer. */
  compact?: boolean;
}

export function ContactMap({ settings, compact = false }: ContactMapProps) {
  const { t } = useUiStrings();
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  if (!hasCoords) {
    return (
      <EmptyState
        title={pickT(t, "contact.map.empty.title", "Karte nicht verfügbar")}
        description={pickT(
          t,
          "contact.map.empty.body",
          "Die Standortkoordinaten wurden noch nicht hinterlegt.",
        )}
      />
    );
  }

  const markers: LeafletMarker[] = [{ lat, lng, label: settings.business_name }];

  if (compact) {
    const osmHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    return (
      <div className="relative h-[175px] border border-line bg-cream">
        <LeafletMap markers={markers} center={[lat, lng]} zoom={14} className="h-full" />
        <a
          href={osmHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 left-2 z-[400] bg-ink/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors duration-base hover:bg-ink"
        >
          {pickT(t, "contact.map.open_external", "In Karten öffnen")} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="border border-line bg-cream">
      <LeafletMap markers={markers} center={[lat, lng]} zoom={14} className="h-[420px]" />
      <div className="border-t border-line px-6 py-4 text-[13px] text-mute">
        <address className="not-italic">
          {settings.address_street}, {settings.address_postcode} {settings.address_city}
        </address>
      </div>
    </div>
  );
}
