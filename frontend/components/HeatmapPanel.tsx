"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import MapboxHeatmap from "@/components/MapboxHeatmap";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Simple equirectangular-style projection of the demo city's lat/lng bounding box
// into panel pixel space. This is the dependency-free fallback map used when no
// NEXT_PUBLIC_MAPBOX_TOKEN is configured -- see MapboxHeatmap.tsx for the real
// Mapbox GL tile renderer, and AUDIT.md for how the two relate. Ward positions
// and risk values are 100% real either way, computed by the backend risk model.
const BOUNDS = { latMin: 26.85, latMax: 26.93, lngMin: 75.76, lngMax: 75.84 };
function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * w;
  const y = h - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * h;
  return { x, y };
}

function riskColor(score: number) {
  if (score >= 70) return "#d35400";
  if (score >= 45) return "#e57231";
  if (score >= 20) return "#2b70b4";
  return "#2E5C99";
}

export default function HeatmapPanel() {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    api.heatmap().then((d) => setHotspots(d.hotspots || [])).catch(() => {});
    const t = setInterval(() => {
      api.heatmap().then((d) => setHotspots(d.hotspots || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const W = 900, H = 520;

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      
      <div className="relative z-20 px-4 py-2 border-b border-line/50 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue" />
          <span className="text-[10px] tracking-widest text-white uppercase font-mono">Live Crime Heatmap</span>
        </div>
        <span className="text-[9px] text-muted font-mono tracking-widest">
          {MAPBOX_TOKEN ? "LIVE MAPBOX TILES" : "AUTO-REFRESH 30s"}
        </span>
      </div>

      {MAPBOX_TOKEN ? (
        <div className="relative flex-1 overflow-hidden z-10">
          <MapboxHeatmap />
          <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
            {["Critical", "High", "Moderate", "Low"].map((band) => (
              <div key={band} className="flex items-center gap-2 bg-black/60 border border-line/50 px-2 py-1 rounded-none text-[9px] font-mono tracking-widest text-muted">
                <span
                  className="w-1.5 h-1.5 rounded-none"
                  style={{
                    background: band === "Critical" ? "#d35400" : band === "High" ? "#e57231" : band === "Moderate" ? "#2b70b4" : "#2E5C99",
                  }}
                />
                {band.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="relative flex-1 grid-overlay scanline overflow-hidden z-10">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
          <defs>
            {hotspots.map((h, i) => (
              <radialGradient id={`glow-${i}`} key={i}>
                <stop offset="0%" stopColor={riskColor(h.risk_score)} stopOpacity="0.55" />
                <stop offset="100%" stopColor={riskColor(h.risk_score)} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* faint ward boundary lines */}
          {[1, 2, 3].map((i) => (
            <line key={i} x1={0} y1={(H / 4) * i} x2={W} y2={(H / 4) * i} stroke="#1B2C46" strokeWidth="1" />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={"v" + i} x1={(W / 4) * i} y1={0} x2={(W / 4) * i} y2={H} stroke="#1B2C46" strokeWidth="1" />
          ))}

          {hotspots.map((h, i) => {
            const { x, y } = project(h.lat, h.lng, W, H);
            const r = 40 + h.risk_score * 0.9;
            return (
              <g key={h.ward} onClick={() => setSelected(h)} className="cursor-pointer">
                <circle cx={x} cy={y} r={r} fill={`url(#glow-${i})`} />
                <circle cx={x} cy={y} r={5} fill={riskColor(h.risk_score)} stroke="#050B18" strokeWidth="2" />
                <text x={x} y={y - r * 0.55} textAnchor="middle" fontSize="11" fill="#C9D4E8" fontFamily="var(--font-body)">
                  {h.ward}
                </text>
              </g>
            );
          })}
        </svg>

        {selected && (
          <div className="absolute bottom-4 left-4 bg-panel2 border border-line p-3 w-64 shadow-blueglow z-20">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-line/50">
              <span className="text-[11px] font-mono tracking-widest font-semibold text-white">{selected.ward.toUpperCase()}</span>
              <button onClick={() => setSelected(null)} className="text-[9px] font-mono tracking-widest text-muted hover:text-white uppercase">
                Close
              </button>
            </div>
            <div className="text-[9px] font-mono tracking-widest text-muted mb-2">RISK BAND: <span style={{ color: riskColor(selected.risk_score) }}>{selected.risk_band.toUpperCase()}</span></div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div>
                <div className="text-muted tracking-widest">SCORE</div>
                <div className="data-mono text-white text-xs">{selected.risk_score}/100</div>
              </div>
              <div>
                <div className="text-muted tracking-widest">CONF</div>
                <div className="data-mono text-white text-xs">{selected.confidence}%</div>
              </div>
              <div className="col-span-2 mt-1 border-t border-line/30 pt-1">
                <div className="text-muted tracking-widest">LIKELY TYPE</div>
                <div className="text-blue/90 uppercase">{selected.likely_crime_types?.[0]?.crime_type}</div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
          {["Critical", "High", "Moderate", "Low"].map((band) => (
            <div key={band} className="flex items-center gap-2 bg-black/60 border border-line/50 px-2 py-1 rounded-none text-[9px] font-mono tracking-widest text-muted">
              <span
                className="w-1.5 h-1.5 rounded-none"
                style={{
                  background: band === "Critical" ? "#d35400" : band === "High" ? "#e57231" : band === "Moderate" ? "#2b70b4" : "#2E5C99",
                }}
              />
              {band.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
