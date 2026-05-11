// src/components/features/contact/ContactMap.tsx
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { LeafletMap } from "@/components/shared";

interface ContactMapProps {
  t: TFunction;
  settings: SettingsPublic;
}

// Headquarters coordinates — Blumenstraße 8, 73779 Deizisau. Hardcoded since
// the office location doesn't change between releases; if you relocate, update
// this single constant and the about-page map.
const HQ = { lat: 48.7240, lng: 9.3854 };

export function ContactMap({ t, settings }: ContactMapProps) {
  const popup = `${settings.business_name}\n${settings.address_street}\n${settings.address_postcode} ${settings.address_city}`;
  return (
    <LeafletMap
      center={HQ}
      zoom={14}
      markers={[{ lat: HQ.lat, lng: HQ.lng, label: settings.business_name, popup }]}
      height="380px"
      ariaLabel={t("contact.map.label")}
    />
  );
}
