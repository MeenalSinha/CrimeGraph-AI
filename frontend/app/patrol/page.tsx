"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

export default function PatrolPage() {
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    api.patrolOptimize().then(setPlan);
  }, []);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Patrol Optimization" />
        <main className="flex-1 p-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Units Deployed" value={plan?.total_units ?? "--"} />
            <SummaryCard label="Wards Covered" value={plan?.summary?.wards_covered ?? "--"} />
            <SummaryCard label="Avg ETA" value={plan ? `${plan.summary.avg_eta_minutes} min` : "--"} />
            <SummaryCard label="Priority Ward" value={plan?.summary?.highest_priority_ward ?? "--"} />
          </div>

          <div className="panel clip-corner-lg rounded-md">
            <div className="px-4 py-3 border-b border-line text-xs tracking-wider text-white uppercase font-medium">
              Unit Assignments
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted border-b border-line text-left">
                    <th className="px-4 py-2 font-medium">Unit</th>
                    <th className="px-4 py-2 font-medium">Home Station</th>
                    <th className="px-4 py-2 font-medium">Assigned Wards</th>
                    <th className="px-4 py-2 font-medium">Distance</th>
                    <th className="px-4 py-2 font-medium">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {plan?.routes?.map((r: any) => (
                    <tr key={r.unit_id} className="border-b border-line/60 hover:bg-white/5">
                      <td className="px-4 py-2 data-mono text-blue">{r.unit_id}</td>
                      <td className="px-4 py-2 text-slate-300">{r.station_name}</td>
                      <td className="px-4 py-2 text-slate-400">{r.assigned_wards.join(" -> ")}</td>
                      <td className="px-4 py-2 data-mono">{r.distance_km} km</td>
                      <td className="px-4 py-2 data-mono text-accent">{r.eta_minutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel clip-corner rounded-md px-4 py-3 flex-1 min-w-[160px]">
      <div className="text-[10px] tracking-wider text-muted uppercase">{label}</div>
      <div className="display-font text-xl text-white mt-1">{value}</div>
    </div>
  );
}
