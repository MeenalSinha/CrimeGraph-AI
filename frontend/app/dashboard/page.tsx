"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import KpiCard from "@/components/KpiCard";
import HeatmapPanel from "@/components/HeatmapPanel";
import CommandConsole from "@/components/CommandConsole";
import CrimeTrendPanel from "@/components/CrimeTrendPanel";
import CrimeCategoriesPanel from "@/components/CrimeCategoriesPanel";
import PatrolPreviewPanel from "@/components/PatrolPreviewPanel";
import AlertsPanel from "@/components/AlertsPanel";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-screen sci-fi-border bg-panel2 overflow-hidden">
        <Topbar title="Command Center" />
        
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 flex flex-col gap-5 overflow-y-auto relative">
            
            <div className="flex flex-wrap gap-4">
              <KpiCard
                label="Total Incidents"
                value={kpis?.total_incidents?.value ?? "--"}
                change={kpis?.total_incidents?.change_pct}
                icon={<CrosshairIcon />}
              />
              <KpiCard
                label="Active Investigations"
                value={kpis?.active_investigations?.value ?? "--"}
                change={kpis?.active_investigations?.change_pct}
                icon={<FolderIcon />}
              />
              <KpiCard
                label="Wanted Persons"
                value={kpis?.wanted_persons?.value ?? "--"}
                change={kpis?.wanted_persons?.change_pct}
                icon={<PersonIcon />}
              />
              <KpiCard
                label="High Risk Areas"
                value={kpis?.high_risk_areas?.value ?? "--"}
                change={kpis?.high_risk_areas?.change_pct}
                icon={<WarnIcon />}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 flex-1 min-h-[520px]">
              <HeatmapPanel />
              <CommandConsole />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 h-auto xl:h-[280px]">
              <CrimeTrendPanel />
              <CrimeCategoriesPanel />
              <PatrolPreviewPanel />
              <AlertsPanel />
            </div>

            <footer className="flex items-center justify-between text-[10px] text-blue/60 px-2 pt-2 border-t border-line/50 mt-2">
              <span className="data-mono" suppressHydrationWarning>CRIMEGRAPH AI v2.0.1 -- BUILD {new Date().toISOString().slice(0, 10)}</span>
              <span className="tracking-[0.3em] font-semibold text-blue">INTELLIGENCE DRIVEN. SAFER TOMORROW.</span>
              <span className="flex items-center gap-1.5">
                SECURE SYSTEM <LockIcon /> 
              </span>
            </footer>
          </main>
        </div>
      </div>
  );
}

function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.6" /></svg>
  );
}
function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6.5A1.5 1.5 0 014.5 5H9l2 2.5h8.5A1.5 1.5 0 0121 9v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6.5z" stroke="currentColor" strokeWidth="1.6" /></svg>
  );
}
function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" stroke="currentColor" strokeWidth="1.6" /></svg>
  );
}
function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l9 16H3l9-16z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M12 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="17" r="0.9" fill="currentColor" /></svg>
  );
}
function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>
  );
}
