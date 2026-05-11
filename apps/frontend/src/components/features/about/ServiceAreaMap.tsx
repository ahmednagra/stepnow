// src/components/features/about/ServiceAreaMap.tsx
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { Container, LeafletMap } from "@/components/shared";

interface ServiceAreaMapProps {
  t: TFunction;
  settings: SettingsPublic;
}

// Hardcoded coordinates for the headquarters + key service-area cities.
// In a future iteration these could come from the backend, but for now they're
// physical constants (a city's location doesn't change between releases).
const HQ_COORDS = { lat: 48.7240, lng: 9.3854 }; // Deizisau approx.
const AREA_MARKERS = [
  { lat: 48.7240, lng: 9.3854, label: "Deizisau" },
  { lat: 48.7758, lng: 9.1829, label: "Stuttgart" },
  { lat: 48.7404, lng: 9.3061, label: "Esslingen am Neckar" },
  { lat: 48.7113, lng: 9.4136, label: "Plochingen" },
];

export function ServiceAreaMap({ t, settings }: ServiceAreaMapProps) {
  const markers = [
    {
      lat: HQ_COORDS.lat,
      lng: HQ_COORDS.lng,
      label: settings.business_name,
      popup: `${settings.business_name}, ${settings.address_street}, ${settings.address_postcode} ${settings.address_city}`,
    },
    ...AREA_MARKERS.filter((m) => m.label !== "Deizisau"),
  ];

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-8 max-w-3xl">
          <h2 className="font-serif text-section">{t("about.service_area.heading")}</h2>
          <p className="mt-3 text-body-lg text-mute">{t("about.service_area.body")}</p>
        </header>
        <LeafletMap
          center={HQ_COORDS}
          zoom={10}
          markers={markers}
          height="480px"
          ariaLabel={t("about.service_area.heading")}
        />
      </Container>
    </section>
  );
}
