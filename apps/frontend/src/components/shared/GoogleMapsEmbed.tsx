// apps/frontend/src/components/shared/GoogleMapsEmbed.tsx
// Renders a Google Maps embed iframe via the keyless "place" URL; only mounts after maps consent.
"use client";
import { memo } from "react";
import { useMapsConsent } from "@/stores/useConsentStore";
import { LeafletMap, type LeafletMarker } from "./LeafletMap";
import { cn } from "@/utils/cn";

interface GoogleMapsEmbedProps {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  className?: string;
  fallbackZoom?: number;
}

function GoogleMapsEmbedImpl({ lat, lng, label, zoom = 15, className, fallbackZoom }: GoogleMapsEmbedProps) {
  const allowed = useMapsConsent();
  if (!allowed) {
    const marker: LeafletMarker = { lat, lng, label };
    return <LeafletMap markers={[marker]} center={[lat, lng]} zoom={fallbackZoom ?? zoom} className={className} />;
  }
  const q = encodeURIComponent(label ? `${label} @${lat},${lng}` : `${lat},${lng}`);
  const src = `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed&hl=de`;
  return (
    <iframe
      src={src}
      title="Google Maps"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-full w-full border-0", className)}
      allowFullScreen
    />
  );
}

export const GoogleMapsEmbed = memo(GoogleMapsEmbedImpl, (p, n) =>
  p.lat === n.lat && p.lng === n.lng && p.label === n.label && p.zoom === n.zoom && p.fallbackZoom === n.fallbackZoom && p.className === n.className
);
