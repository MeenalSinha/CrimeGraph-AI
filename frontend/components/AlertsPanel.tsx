"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-accent2/40 text-accent2 bg-accent2/10",
  warning: "border-accent/40 text-accent bg-accent/10",
  info: "border-blue/40 text-blue bg-blue/10",
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    api.alerts().then((d) => setAlerts(d.alerts || [])).catch(() => {});
  }, []);

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      
      <div className="relative z-20 px-4 py-2 border-b border-line/50 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue" />
          <span className="text-[10px] tracking-widest text-white uppercase font-mono">Recent Alerts</span>
        </div>
      </div>
      
      <div className="relative z-20 flex-1 p-3 space-y-2 overflow-y-auto pr-1">
        {alerts.slice(0, 4).map((a, i) => (
          <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-none border border-l-2 ${SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info} bg-panel2/50 backdrop-blur-sm`}>
            <AlertGlyph severity={a.severity} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-mono tracking-widest text-white truncate font-semibold uppercase">{a.title}</div>
              <div className="text-[10px] font-mono tracking-wider text-muted truncate mt-0.5">{a.message}</div>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-muted whitespace-nowrap bg-black/40 px-1.5 py-0.5">{a.created_minutes_ago}m ago</span>
          </div>
        ))}
        {alerts.length === 0 && <div className="text-[11px] font-mono tracking-widest text-muted p-2">NO ACTIVE ALERTS.</div>}
      </div>
      <div className="relative z-20 px-4 py-2 border-t border-line/30 bg-black/40">
        <a href="/alerts" className="text-[9px] font-mono tracking-widest text-blue hover:text-white transition-colors uppercase flex items-center gap-2">
          View all alerts <span className="text-accent">&rarr;</span>
        </a>
      </div>
    </div>
  );
}

function AlertGlyph({ severity }: { severity: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
      <path d="M12 3l9 16H3l9-16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}
