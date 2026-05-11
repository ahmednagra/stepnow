// src/components/shared/LeafletMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

export interface LeafletMarker {
  lat: number;
  lng: number;
  label?: string;
  /** Optional popup HTML (kept simple — plain text). */
  popup?: string;
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: LeafletMarker[];
  height?: string;
  className?: string;
  /** ARIA label for the map region. */
  ariaLabel?: string;
}

/**
 * Leaflet + OpenStreetMap wrapper. Loaded purely client-side because Leaflet
 * touches window/document. Tiles fetched directly from OSM — DSGVO-safe (no
 * cookies, no profiling). Per docs/architecture/frontend.md §2 and §13.
 *
 * Renders a static placeholder during SSR and before hydration.
 */
export function LeafletMap({
  center,
  zoom = 13,
  markers = [],
  height = "400px",
  className,
  ariaLabel = "Karte",
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let mapInstance: unknown = null;

    async function init() {
      if (!containerRef.current) return;
      try {
        const L = (await import("leaflet")).default;
        // CSS injected manually so we don't need a global import
        if (!document.querySelector('link[data-leaflet-css]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.crossOrigin = "anonymous";
          link.setAttribute("data-leaflet-css", "true");
          document.head.appendChild(link);
        }

        if (!mounted || !containerRef.current) return;
        const map = L.map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom,
          scrollWheelZoom: false,
        });
        mapInstance = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        for (const m of markers) {
          const marker = L.marker([m.lat, m.lng], m.label ? { title: m.label } : undefined).addTo(map);
          if (m.popup) marker.bindPopup(m.popup);
        }

        setReady(true);
      } catch (err) {
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.error("[LeafletMap] failed to load:", err);
        setFailed(true);
      }
    }

    init();

    return () => {
      mounted = false;
      if (mapInstance && typeof (mapInstance as { remove?: () => void }).remove === "function") {
        (mapInstance as { remove: () => void }).remove();
      }
    };
    // Center/zoom/markers are intentionally not in the dep array — the map
    // is initialized once. Pages remount the component to change location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative w-full overflow-hidden border border-line", className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        style={{ height }}
        className="bg-line/30"
      />
      {!ready && !failed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-mute"
        >
          Karte wird geladen…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream text-sm text-mute">
          Karte konnte nicht geladen werden.
        </div>
      )}
    </div>
  );
}
