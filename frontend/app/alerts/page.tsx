"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-accent2/40 text-accent2 bg-accent2/5",
  warning: "border-accent/40 text-accent bg-accent/5",
  info: "border-blue/40 text-blue bg-blue/5",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.alerts().then((d) => setAlerts(d.alerts || []));
  }, []);

  const filtered = filter ? alerts.filter((a) => a.type === filter) : alerts;
  const types = Array.from(new Set(alerts.map((a) => a.type)));

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Alerts Engine" />
        <main className="flex-1 p-5">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilter("")}
              className={`px-3 py-1.5 rounded-md text-[11px] border ${filter === "" ? "border-accent text-accent" : "border-line text-muted"}`}
            >
              All ({alerts.length})
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[11px] border ${filter === t ? "border-accent text-accent" : "border-line text-muted"}`}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a, i) => (
              <div key={i} className={`panel clip-corner rounded-md p-4 border ${SEVERITY_STYLE[a.severity]}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium">{a.title}</span>
                  <span className="text-[9px] text-muted">{a.created_minutes_ago}m ago</span>
                </div>
                <p className="text-[12px] text-slate-300">{a.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] uppercase tracking-wider text-muted">{a.type.replace(/_/g, " ")}</span>
                  {a.ward && <span className="text-[9px] text-muted">{a.ward}</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-sm text-muted">No alerts match this filter.</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
