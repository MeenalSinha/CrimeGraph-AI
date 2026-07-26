"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

const REPORTS = [
  { kind: "crime-trend" as const, title: "Crime Trend Report", desc: "Incident breakdown by crime type and ward for the demo city." },
  { kind: "patrol" as const, title: "Patrol Deployment Report", desc: "Current unit assignments, routes, distances and ETAs." },
  { kind: "network" as const, title: "Criminal Network Report", desc: "Graph statistics and detected clusters / candidate gangs." },
];

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Reports" />
        <main className="flex-1 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORTS.map((r) => (
            <div key={r.kind} className="panel clip-corner-lg rounded-md p-5 flex flex-col">
              <div className="w-10 h-10 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <div className="text-sm text-white font-medium mb-1">{r.title}</div>
              <p className="text-[11px] text-muted flex-1">{r.desc}</p>
              <div className="flex gap-2 mt-4">
                <a
                  href={api.reportUrl(r.kind, "pdf")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md bg-gradient-to-br from-accent to-accent2 text-black text-xs font-semibold"
                >
                  PDF
                </a>
                <a
                  href={api.reportUrl(r.kind, "csv")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md border border-blue/40 text-blue text-xs font-semibold hover:bg-blue/10"
                >
                  CSV
                </a>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
