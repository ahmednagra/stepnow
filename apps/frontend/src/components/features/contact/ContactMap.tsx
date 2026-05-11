// apps/frontend/src/components/features/contact/ContactMap.tsx
// Phase 3d polish — refined frame around the Leaflet map; safe fallback when
// coordinates are missing.

"use client";

import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { LeafletMap, type LeafletMarker } from "@/components/shared";
import { EmptyState } from "@/components/shared";

interface ContactMapProps {
  t: TFunction;
  settings: SettingsPublic;
}

export function ContactMap({ t, settings }: ContactMapProps) {
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  if (!hasCoords) {
    return (
      <EmptyState
        title={t("contact.map.empty.title") || "Karte nicht verfügbar"}
        description={
          t("contact.map.empty.body") ||
          "Die Standortkoordinaten wurden noch nicht hinterlegt."
        }
      />
    );
  }

  const markers: LeafletMarker[] = [
    {
      lat,
      lng,
      label: settings.business_name,
    },
  ];

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
