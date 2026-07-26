"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PatrolPreviewPanel() {
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    api.patrolOptimize().then(setPlan).catch(() => {});
  }, []);

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      
      <div className="relative z-20 px-4 py-2 border-b border-line/50 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue" />
          <span className="text-[10px] tracking-widest text-white uppercase font-mono">Patrol Optimizer</span>
        </div>
        <a href="/patrol" className="text-[9px] text-accent hover:text-white transition-colors uppercase font-mono tracking-widest">Full view</a>
      </div>

      <div className="relative z-20 p-4 flex flex-col flex-1">
        <div className="flex-1 relative overflow-hidden border border-line/60 grid-overlay scanline bg-black/50 mb-3">
          <svg viewBox="0 0 300 160" className="w-full h-full relative z-10">
            {plan?.routes?.slice(0, 4).map((r: any, ri: number) => {
              const pts = r.route.map((s: any, i: number) => {
                const x = 30 + ((s.lng ?? 0) % 1) * 2000 % 240;
                const y = 20 + ((s.lat ?? 0) % 1) * 2000 % 120;
                return `${x},${y}`;
              });
              return (
                <polyline
                  key={ri}
                  points={pts.join(" ")}
                  fill="none"
                  stroke={ri % 2 === 0 ? "#2b70b4" : "#e57231"}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div>
            <div className="text-[9px] font-mono text-muted tracking-widest mb-1">OPTIMAL DISTANCE</div>
            <div className="data-mono text-lg text-blue font-semibold">{plan?.summary?.optimal_distance_km ?? "--"} <span className="text-[10px] text-muted">KM</span></div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-muted tracking-widest mb-1">AVG ETA</div>
            <div className="data-mono text-lg text-accent font-semibold">{plan?.summary?.avg_eta_minutes ?? "--"} <span className="text-[10px] text-muted">MIN</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
