"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  "Under Investigation": "text-accent border-accent/40",
  "Chargesheet Filed": "text-blue border-blue/40",
  Closed: "text-emerald-400 border-emerald-400/40",
  Cold: "text-muted border-line",
};

export default function InvestigationsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.cases(status || undefined).then((d) => setCases(d.cases || []));
  }, [status]);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Investigations" />
        <main className="flex-1 p-5">
          <div className="panel clip-corner-lg rounded-md flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="text-xs tracking-wider text-white uppercase font-medium">Case Register</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-black/30 border border-line rounded-md px-3 py-1.5 text-xs text-white"
              >
                <option value="">All statuses</option>
                <option>Under Investigation</option>
                <option>Chargesheet Filed</option>
                <option>Closed</option>
                <option>Cold</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted border-b border-line text-left">
                    <th className="px-4 py-2 font-medium">FIR ID</th>
                    <th className="px-4 py-2 font-medium">Crime Type</th>
                    <th className="px-4 py-2 font-medium">Ward</th>
                    <th className="px-4 py-2 font-medium">Severity</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Suspect Linked</th>
                    <th className="px-4 py-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.fir_id} className="border-b border-line/60 hover:bg-white/5">
                      <td className="px-4 py-2">
                        <a href={`/investigations/${c.fir_id}`} className="text-blue hover:underline data-mono">{c.fir_id}</a>
                      </td>
                      <td className="px-4 py-2 text-slate-200">{c.crime_type}</td>
                      <td className="px-4 py-2 text-slate-400">{c.ward}</td>
                      <td className="px-4 py-2">
                        <span className="data-mono">{c.severity}/5</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${STATUS_COLOR[c.status] || "text-muted border-line"}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-400">{c.has_suspect ? "Yes" : "No"}</td>
                      <td className="px-4 py-2 text-muted data-mono">{new Date(c.timestamp).toLocaleString()}</td>
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
