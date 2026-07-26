"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { api } from "@/lib/api";

export default function CaseDetailPage() {
  const params = useParams();
  const firId = params?.id as string;
  const [brief, setBrief] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!firId) return;
    api.caseDetail(firId).then(setBrief).catch(() => setError(true));
  }, [firId]);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={`Case ${firId}`} />
        <main className="flex-1 p-5">
          {error && <div className="text-sm text-red-400">Case not found.</div>}
          {!brief && !error && <div className="text-sm text-muted">Loading investigation copilot brief...</div>}
          {brief && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
              <div className="flex flex-col gap-4">
                <div className="panel clip-corner-lg rounded-md p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="display-font text-lg text-white">{brief.fir_id}</span>
                    <span className="text-[10px] px-2 py-1 rounded border border-accent/40 text-accent">
                      Case Risk Score: {brief.case_risk_score}/100
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{brief.summary}</p>
                  <div className="grid grid-cols-4 gap-3 mt-4 text-[11px]">
                    <div><div className="text-muted">Crime Type</div><div className="text-white">{brief.crime_type}</div></div>
                    <div><div className="text-muted">Ward</div><div className="text-white">{brief.ward}</div></div>
                    <div><div className="text-muted">Severity</div><div className="text-white">{brief.severity}/5</div></div>
                    <div><div className="text-muted">Weapon</div><div className="text-white">{brief.weapon}</div></div>
                  </div>
                </div>

                <div className="panel clip-corner rounded-md p-5">
                  <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">AI Investigation Suggestions</div>
                  <ul className="space-y-2">
                    {brief.next_steps?.map((s: string, i: number) => (
                      <li key={i} className="text-[12px] text-slate-300 flex gap-2">
                        <span className="text-accent shrink-0">{String(i + 1).padStart(2, "0")}</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="panel clip-corner rounded-md p-5">
                  <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Missing Evidence Flags</div>
                  {brief.missing_evidence?.length ? (
                    <ul className="space-y-2">
                      {brief.missing_evidence.map((s: string, i: number) => (
                        <li key={i} className="text-[12px] text-accent/90 flex gap-2">
                          <span>!</span>{s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[12px] text-muted">No evidence gaps flagged.</div>
                  )}
                </div>

                <div className="panel clip-corner rounded-md p-5">
                  <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Related Cases</div>
                  <div className="space-y-1.5">
                    {brief.related_cases?.map((r: any) => (
                      <a key={r.fir_id} href={`/investigations/${r.fir_id}`} className="flex justify-between text-[11px] hover:bg-white/5 px-2 py-1.5 rounded-md">
                        <span className="text-blue data-mono">{r.fir_id}</span>
                        <span className="text-muted">{new Date(r.timestamp).toLocaleDateString()}</span>
                        <span className="text-slate-400">{r.status}</span>
                      </a>
                    ))}
                    {brief.related_cases?.length === 0 && <div className="text-[11px] text-muted">No related cases in this ward for this crime type.</div>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {brief.suspect ? (
                  <div className="panel clip-corner rounded-md p-4">
                    <div className="text-[10px] text-muted tracking-wider mb-1">SUSPECT LINKED</div>
                    <div className="text-sm text-white font-medium">{brief.suspect.name}</div>
                    <div className="text-[11px] text-muted mb-2">{brief.suspect.person_id}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><div className="text-muted">Risk score</div><div className="data-mono text-accent">{brief.suspect.risk_score}</div></div>
                      <div><div className="text-muted">Prior cases</div><div className="data-mono text-white">{brief.suspect.prior_case_count}</div></div>
                      {brief.suspect.gang_affiliation && (
                        <div className="col-span-2"><div className="text-muted">Gang</div><div className="text-accent">{brief.suspect.gang_affiliation}</div></div>
                      )}
                    </div>
                    <a href="/network" className="mt-3 inline-block text-[10px] text-blue hover:underline">View in graph explorer &rarr;</a>
                  </div>
                ) : (
                  <div className="panel clip-corner rounded-md p-4 text-[11px] text-muted">No suspect currently linked to this FIR.</div>
                )}

                {brief.possible_accomplices?.length > 0 && (
                  <div className="panel clip-corner rounded-md p-4">
                    <div className="text-[10px] text-muted tracking-wider mb-2">POSSIBLE ACCOMPLICES</div>
                    <div className="space-y-1.5">
                      {brief.possible_accomplices.map((a: any) => (
                        <div key={a.person_id} className="flex justify-between text-[11px]">
                          <span className="text-slate-200">{a.label}</span>
                          <span className="text-accent text-[10px]">{a.gang || "POI"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
