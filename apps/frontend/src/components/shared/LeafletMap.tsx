// apps/frontend/src/components/shared/LeafletMap.tsx
// Phase 3d polish — calmer container, gold tinted marker, restrained controls.

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

export interface LeafletMarker {
  lat: number;
  lng: number;
  label?: string;
}

interface LeafletMapProps {
  markers: LeafletMarker[];
  center: [number, number];
  zoom?: number;
  className?: string;
}

/**
 * Lightweight Leaflet wrapper — avoids the React-Leaflet dependency. Loaded
 * client-side only since Leaflet touches window.
 */
export function LeafletMap({ markers, center, zoom = 13, className }: LeafletMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      // Initialize once.
      if (!mapRef.current) {
        // Default marker icon paths (Leaflet's bundled assets sometimes break in Next).
        const DefaultIcon = L.icon({
          iconUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path fill="#86683F" stroke="#0F1115" stroke-width="1.5" d="M16 1 C8 1 2 7 2 15 c0 9 14 24 14 24 s14-15 14-24 c0-8-6-14-14-14z"/><circle cx="16" cy="14" r="5" fill="#F5F2EC"/></svg>`,
            ),
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        const map = L.map(ref.current, {
          center,
          zoom,
          scrollWheelZoom: false,
          zoomControl: true,
        });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        for (const m of markers) {
          const marker = L.marker([m.lat, m.lng]).addTo(map);
          if (m.label) marker.bindPopup(m.label);
        }
        mapRef.current = map;
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative w-full bg-paper", className)}
      aria-label="Standort"
    />
  );
}
