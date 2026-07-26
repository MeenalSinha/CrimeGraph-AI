"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    api.districtComparison().then((d) => setDistricts(d.districts || []));
    api.officerProductivity().then((d) => setStations(d.stations || []));
    api.crimeRecurrence().then(setRecurrence);
    api.anomalies().then((d) => setAnomalies(d.anomalies || []));
  }, []);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Advanced Analytics" />
        <main className="flex-1 p-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Suspects w/ Cases" value={recurrence?.total_suspects_with_cases ?? "--"} />
            <SummaryCard label="Repeat Offenders" value={recurrence?.repeat_offenders ?? "--"} />
            <SummaryCard label="Max Cases (1 suspect)" value={recurrence?.max_cases_single_suspect ?? "--"} />
            <SummaryCard label="Anomalous Ward-Days" value={anomalies.length} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="panel clip-corner-lg rounded-md p-4">
              <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">District Comparison</div>
              <div className="h-56 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districts} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="#1B2C46" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#7C8AA6" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="ward" type="category" stroke="#7C8AA6" fontSize={10} width={90} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0A1526", border: "1px solid #1B2C46", fontSize: 11 }} />
                    <Bar dataKey="total_incidents" fill="#3FA9FF" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px]">
                  <thead>
                    <tr className="text-muted text-left border-b border-line">
                      <th className="py-1.5 font-medium">Ward</th>
                      <th className="py-1.5 font-medium">Incidents</th>
                      <th className="py-1.5 font-medium">Avg Severity</th>
                      <th className="py-1.5 font-medium">Clearance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((d) => (
                      <tr key={d.ward} className="border-b border-line/50">
                        <td className="py-1.5 text-slate-200">{d.ward}</td>
                        <td className="py-1.5 data-mono">{d.total_incidents}</td>
                        <td className="py-1.5 data-mono">{d.avg_severity}</td>
                        <td className="py-1.5 data-mono text-accent">{d.clearance_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel clip-corner-lg rounded-md p-4">
              <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Officer Productivity</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px]">
                  <thead>
                    <tr className="text-muted text-left border-b border-line">
                      <th className="py-1.5 font-medium">Station</th>
                      <th className="py-1.5 font-medium">Officers</th>
                      <th className="py-1.5 font-medium">Cases</th>
                      <th className="py-1.5 font-medium">Cases/Officer</th>
                      <th className="py-1.5 font-medium">Clearance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((s) => (
                      <tr key={s.station_id} className="border-b border-line/50">
                        <td className="py-1.5 text-slate-200">{s.station_name}</td>
                        <td className="py-1.5 data-mono">{s.officer_count}</td>
                        <td className="py-1.5 data-mono">{s.total_cases}</td>
                        <td className="py-1.5 data-mono text-blue">{s.cases_per_officer}</td>
                        <td className="py-1.5 data-mono text-accent">{s.clearance_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="panel clip-corner rounded-md p-4">
              <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Recurring Ward / Crime-Type Pairs</div>
              <div className="space-y-1.5">
                {recurrence?.recurring_ward_crime_pairs?.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px] px-2 py-1.5 rounded-md hover:bg-white/5">
                    <span className="text-slate-300">{r.ward} -- {r.crime_type}</span>
                    <span className="data-mono text-accent">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel clip-corner rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-wider text-white uppercase font-medium">Anomaly Detection</span>
                <span className="text-[9px] text-muted">IsolationForest</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {anomalies.map((a, i) => (
                  <div key={i} className="flex justify-between text-[11px] px-2 py-1.5 rounded-md border border-accent2/30 bg-accent2/5">
                    <span className="text-slate-200">{a.ward} -- {a.date}</span>
                    <span className="data-mono text-accent2">{a.incident_count} incidents</span>
                  </div>
                ))}
                {anomalies.length === 0 && <div className="text-[11px] text-muted">No anomalies flagged.</div>}
              </div>
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
