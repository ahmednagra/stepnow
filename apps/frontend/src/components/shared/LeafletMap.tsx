// apps/frontend/src/components/shared/LeafletMap.tsx
// Client-only Leaflet wrapper used as the DSGVO-clean fallback before maps consent is given.
"use client";
import "leaflet/dist/leaflet.css";
import { memo, useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

export interface LeafletMarker { lat: number; lng: number; label?: string }
interface LeafletMapProps {
  markers: LeafletMarker[];
  center: [number, number];
  zoom?: number;
  className?: string;
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path fill="#86683F" stroke="#0F1115" stroke-width="1.5" d="M16 1 C8 1 2 7 2 15 c0 9 14 24 14 24 s14-15 14-24 c0-8-6-14-14-14z"/><circle cx="16" cy="14" r="5" fill="#F5F2EC"/></svg>`;
const ICON_URL = "data:image/svg+xml;utf8," + encodeURIComponent(ICON_SVG);

function LeafletMapImpl({ markers, center, zoom = 13, className }: LeafletMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    const key = `${center[0]},${center[1]},${zoom},${markers.map(m => `${m.lat},${m.lng},${m.label ?? ""}`).join("|")}`;
    if (key === lastKey.current && mapRef.current) return;
    lastKey.current = key;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      if (!mapRef.current) {
        L.Marker.prototype.options.icon = L.icon({ iconUrl: ICON_URL, iconSize: [32, 40], iconAnchor: [16, 40] });
        const map = L.map(ref.current, { center, zoom, scrollWheelZoom: false, zoomControl: true, preferCanvas: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      } else {
        mapRef.current.setView(center, zoom, { animate: false });
        layerRef.current.clearLayers();
      }
      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng]);
        if (m.label) marker.bindPopup(m.label);
        marker.addTo(layerRef.current);
      }
    })();
    return () => { cancelled = true; };
  }, [center, zoom, markers]);

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; layerRef.current = null; }
  }, []);

  return <div ref={ref} className={cn("relative w-full bg-paper", className)} aria-label="Standort" />;
}

export const LeafletMap = memo(LeafletMapImpl, (prev, next) =>
  prev.zoom === next.zoom &&
  prev.className === next.className &&
  prev.center[0] === next.center[0] &&
  prev.center[1] === next.center[1] &&
  prev.markers.length === next.markers.length &&
  prev.markers.every((m, i) => m.lat === next.markers[i].lat && m.lng === next.markers[i].lng && m.label === next.markers[i].label)
);
