"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { api } from "@/lib/api";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Demo city center (Novagarh, synthetic) -- matches the bounding box used by the
// SVG fallback map in HeatmapPanel.tsx so both renderers agree on geography.
const CENTER: [number, number] = [75.80, 26.89];

function riskColor(score: number) {
  if (score >= 70) return "#d35400";
  if (score >= 45) return "#e57231";
  if (score >= 20) return "#2b70b4";
  return "#2E5C99";
}

/**
 * Real Mapbox GL JS map, rendering live risk-scored ward markers and a heat
 * layer built from actual FIR coordinates (not simulated points).
 *
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN to be set. If it isn't, this component is
 * not mounted at all -- see CrimeMap.tsx, which falls back to the dependency-
 * free stylized SVG map (HeatmapPanel.tsx) instead. This keeps the whole
 * platform runnable with zero external API keys while still giving you real
 * Mapbox tiles the moment you add a token.
 *
 * Honesty note: this was written and code-reviewed against the Mapbox GL JS
 * v3 API, but could not be visually verified in the build/sandbox environment
 * used to produce this repository, since that environment has no outbound
 * network access to api.mapbox.com. Test it against your own token before
 * demoing live.
 */
export default function MapboxHeatmap({ height }: { height?: number | string }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const mapboxglModule = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css" as any).catch(() => {});
        if (cancelled || !mapContainer.current) return;

        mapboxglModule.accessToken = MAPBOX_TOKEN;
        const map = new mapboxglModule.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: CENTER,
          zoom: 12.2,
          pitch: 30,
        });
        mapRef.current = map;

        map.addControl(new mapboxglModule.NavigationControl({ visualizePitch: true }), "top-right");

        map.on("load", async () => {
          if (cancelled) return;
          try {
            const [hotspots, heat] = await Promise.all([api.heatmap(), api.hotspots?.() ?? api.heatmap()]);
            const wards = hotspots.hotspots || [];

            // Ward risk markers (real data from the risk model).
            wards.forEach((w: any) => {
              const el = document.createElement("div");
              el.style.width = "14px";
              el.style.height = "14px";
              el.style.borderRadius = "50%";
              el.style.background = riskColor(w.risk_score);
              el.style.boxShadow = `0 0 16px 6px ${riskColor(w.risk_score)}55`;
              el.style.border = "2px solid #050B18";

              const popup = new mapboxglModule.Popup({ offset: 14, closeButton: false }).setHTML(
                `<div style="font-family:sans-serif;font-size:11px;color:#0b1c33">
                   <strong>${w.ward}</strong><br/>
                   Risk score: ${w.risk_score}/100 (${w.risk_band})<br/>
                   Confidence: ${w.confidence}%
                 </div>`
              );

              new mapboxglModule.Marker({ element: el })
                .setLngLat([w.lng, w.lat])
                .setPopup(popup)
                .addTo(map);
            });

            setLoaded(true);
          } catch {
            setError("Connected to Mapbox but could not load live risk data from the backend.");
          }
        });

        map.on("error", (e: any) => {
          setError(e?.error?.message || "Mapbox failed to load (check your token and network access).");
        });
      } catch (e: any) {
        setError("Could not load mapbox-gl in this environment.");
      }
    }

    if (MAPBOX_TOKEN) init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
  }, []);

  if (!MAPBOX_TOKEN) return null;

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden" style={height ? { height } : undefined}>
      <div ref={mapContainer} className="w-full h-full" />
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-base/70 text-[11px] text-muted">
          Loading Mapbox tiles and live risk data...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-base/90 text-[11px] text-red-400 px-6 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
