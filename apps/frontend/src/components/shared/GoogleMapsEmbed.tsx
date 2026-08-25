// src/components/shared/GoogleMapsEmbed.tsx
// Map surface with a DSGVO gate. Before maps consent NOTHING third-party is requested — not
// Google, and not OpenStreetMap tiles either, which is the leak the earlier Leaflet fallback
// still had. The placeholder offers a link (a link is not a request) and an opt-in button.
"use client";
import { memo } from "react";
import { MapPin } from "lucide-react";
import { useConsentStore, useMapsConsent } from "@/stores/useConsentStore";
import { LeafletMap, type LeafletMarker } from "./LeafletMap";
import { cn } from "@/utils/cn";

interface GoogleMapsEmbedProps {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  className?: string;
  fallbackZoom?: number;
  loadLabel?: string;
  noticeLabel?: string;
  externalLabel?: string;
}

function GoogleMapsEmbedImpl({
  lat, lng, label, zoom = 15, className, fallbackZoom,
  loadLabel = "Karte laden",
  noticeLabel = "Beim Laden werden Kartendaten von OpenStreetMap abgerufen; dabei wird Ihre IP-Adresse übertragen.",
  externalLabel = "In Google Maps öffnen",
}: GoogleMapsEmbedProps) {
  const allowed = useMapsConsent();
  const save = useConsentStore((s) => s.save);
  const externalHref = `https://maps.google.com/maps?q=${encodeURIComponent(label ? `${label} @${lat},${lng}` : `${lat},${lng}`)}`;

  if (!allowed) {
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--color-bg-soft,#F5F2EC)] p-6 text-center", className)}>
        <MapPin aria-hidden className="h-6 w-6 opacity-60" />
        {label ? <p className="text-sm font-medium">{label}</p> : null}
        <p className="max-w-sm text-xs leading-relaxed opacity-70">{noticeLabel}</p>
        <button
          type="button"
          onClick={() => save({ maps: true })}
          className="rounded border border-current px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {loadLabel}
        </button>
        <a href={externalHref} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100">
          {externalLabel}
        </a>
      </div>
    );
  }

  const marker: LeafletMarker = { lat, lng, label };
  return <LeafletMap markers={[marker]} center={[lat, lng]} zoom={fallbackZoom ?? zoom} className={className} />;
}

export const GoogleMapsEmbed = memo(GoogleMapsEmbedImpl, (p, n) =>
  p.lat === n.lat && p.lng === n.lng && p.label === n.label && p.zoom === n.zoom && p.fallbackZoom === n.fallbackZoom && p.className === n.className
);
