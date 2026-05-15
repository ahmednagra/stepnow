// apps/frontend/src/components/features/contact/ContactMap.tsx
// Contact-page map: shows Google Maps after consent, OpenStreetMap fallback before; compact + full variants.
"use client";
import { memo, useMemo } from "react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { EmptyState, GoogleMapsEmbed } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface ContactMapProps { settings: SettingsPublic; compact?: boolean }

function ContactMapImpl({ settings, compact = false }: ContactMapProps) {
  const { t } = useUiStrings();
  const lat = Number(settings.address_lat);
  const lng = Number(settings.address_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const osmHref = useMemo(
    () => hasCoords ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` : null,
    [hasCoords, lat, lng],
  );

  if (!hasCoords) {
    return (
      <EmptyState
        title={pickT(t, "contact.map.empty.title", "Karte nicht verfügbar")}
        description={pickT(t, "contact.map.empty.body", "Die Standortkoordinaten wurden noch nicht hinterlegt.")}
      />
    );
  }

  if (compact) {
    return (
      <div className="relative h-[175px] border border-line bg-cream">
        <GoogleMapsEmbed lat={lat} lng={lng} label={settings.business_name} zoom={14} fallbackZoom={14} className="h-full" />
        {osmHref && (
          <a href={osmHref} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 left-2 z-[400] bg-ink/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors duration-base hover:bg-ink">
            {pickT(t, "contact.map.open_external", "In Karten öffnen")} ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="border border-line bg-cream">
      <div className="h-[420px] w-full">
        <GoogleMapsEmbed lat={lat} lng={lng} label={settings.business_name} zoom={15} fallbackZoom={14} className="h-full" />
      </div>
      <div className="border-t border-line px-6 py-4 text-[13px] text-mute">
        <address className="not-italic">{settings.address_street}, {settings.address_postcode} {settings.address_city}</address>
      </div>
    </div>
  );
}

export const ContactMap = memo(ContactMapImpl, (p, n) =>
  p.compact === n.compact &&
  p.settings.address_lat === n.settings.address_lat &&
  p.settings.address_lng === n.settings.address_lng &&
  p.settings.business_name === n.settings.business_name &&
  p.settings.address_street === n.settings.address_street &&
  p.settings.address_postcode === n.settings.address_postcode &&
  p.settings.address_city === n.settings.address_city
);
