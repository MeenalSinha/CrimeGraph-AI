"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import GraphCanvas from "@/components/GraphCanvas";
import { api } from "@/lib/api";

export default function NetworkPage() {
  const [stats, setStats] = useState<any>(null);
  const [centrality, setCentrality] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any>(null);
  const [pathSource, setPathSource] = useState("");
  const [pathTarget, setPathTarget] = useState("");
  const [pathResult, setPathResult] = useState<any>(null);
  const [tab, setTab] = useState<"centrality" | "communities" | "resolution" | "hidden-links">("centrality");
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [hiddenLinks, setHiddenLinks] = useState<any[]>([]);

  useEffect(() => {
    api.networkStats().then(setStats);
    api.centrality(10).then((d) => {
      setCentrality(d.ranking || []);
      if (d.ranking?.length) loadNode(d.ranking[0].person_id);
    });
    api.communities(3).then((d) => setCommunities(d.communities || []));
    api.entityResolution(80).then((d) => setDuplicates(d.candidates || []));
    api.linkPrediction(undefined, 12).then((d) => setHiddenLinks(d.predictions || []));
  }, []);

  async function loadNode(id: string) {
    setSelectedNode(id);
    const [detail, expansion] = await Promise.all([api.networkNode(id), api.networkExpand(id, 1, 35)]);
    setNodeDetail(detail);
    setGraph(expansion);
  }

  async function runShortestPath() {
    if (!pathSource || !pathTarget) return;
    try {
      const r = await api.shortestPath(pathSource, pathTarget);
      setPathResult(r);
      if (r.found) setGraph(r.subgraph);
    } catch {
      setPathResult({ found: false });
    }
  }

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Intelligence Graph Explorer" />
        <main className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <div className="flex flex-col gap-4">
            <div className="panel clip-corner-lg rounded-md p-3 h-[440px] flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs tracking-wider text-white uppercase font-medium">
                  Graph {selectedNode ? `-- Neighborhood of ${nodeDetail?.label || selectedNode}` : ""}
                </span>
                <span className="text-[10px] text-muted data-mono">
                  {stats ? `${stats.node_count} nodes / ${stats.edge_count} edges` : "--"}
                </span>
              </div>
              <div className="flex-1 grid-overlay rounded-md overflow-hidden">
                <GraphCanvas nodes={graph.nodes} edges={graph.edges} onNodeClick={loadNode} height={380} />
              </div>
            </div>

            <div className="panel clip-corner rounded-md p-4">
              <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Shortest Path Finder</div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={pathSource}
                  onChange={(e) => setPathSource(e.target.value)}
                  placeholder="Source person ID (e.g. P-00042)"
                  className="bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white placeholder:text-muted"
                />
                <input
                  value={pathTarget}
                  onChange={(e) => setPathTarget(e.target.value)}
                  placeholder="Target person ID"
                  className="bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white placeholder:text-muted"
                />
                <button onClick={runShortestPath} className="px-4 py-2 rounded-md bg-gradient-to-br from-accent to-accent2 text-black text-xs font-semibold">
                  Find Path
                </button>
              </div>
              {pathResult && (
                <div className="mt-3 text-[11px] text-slate-300">
                  {pathResult.found ? (
                    <>
                      <div className="mb-1">{pathResult.explanation}</div>
                      <div className="data-mono text-muted">{pathResult.path.join(" -> ")}</div>
                    </>
                  ) : (
                    <span className="text-muted">No connecting path found -- check the IDs and try again.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {nodeDetail && (
              <div className="panel clip-corner rounded-md p-4">
                <div className="text-[10px] text-muted tracking-wider mb-1">SELECTED NODE</div>
                <div className="text-sm text-white font-medium mb-2">{nodeDetail.label} <span className="text-muted text-[10px]">({nodeDetail.type})</span></div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {nodeDetail.risk_score !== undefined && (
                    <div><div className="text-muted">Risk score</div><div className="data-mono text-white">{nodeDetail.risk_score}</div></div>
                  )}
                  <div><div className="text-muted">Degree</div><div className="data-mono text-white">{nodeDetail.degree}</div></div>
                  {nodeDetail.gang && <div className="col-span-2"><div className="text-muted">Gang affiliation</div><div className="text-accent">{nodeDetail.gang}</div></div>}
                </div>
              </div>
            )}

            <div className="panel clip-corner rounded-md flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-line">
                {(["centrality", "communities", "resolution", "hidden-links"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-[10px] tracking-wider uppercase ${tab === t ? "text-accent border-b-2 border-accent" : "text-muted"}`}
                  >
                    {t.replace("-", " ")}
                  </button>
                ))}
              </div>
              <div className="p-3 overflow-y-auto flex-1 space-y-2">
                {tab === "centrality" && centrality.map((c) => (
                  <button
                    key={c.person_id}
                    onClick={() => loadNode(c.person_id)}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-white/5 border border-line/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[11px] text-white">{c.label}</div>
                      <div className="text-[9px] text-muted">{c.gang || "no gang flagged"}</div>
                    </div>
                    <div className="text-right">
                      <div className="data-mono text-[11px] text-accent">{c.influence_score}</div>
                      <div className="text-[9px] text-muted">influence</div>
                    </div>
                  </button>
                ))}
                {tab === "communities" && communities.map((c) => (
                  <div key={c.community_id} className="px-2.5 py-2 rounded-md border border-line/60">
                    <div className="flex justify-between text-[11px] text-white mb-1">
                      <span>{c.community_id}</span>
                      <span className="data-mono text-blue">{c.size} members</span>
                    </div>
                    <div className="text-[9px] text-muted">
                      {c.suspected_gang ? `Suspected: ${c.suspected_gang}` : "Unlabeled cluster"} · {c.person_of_interest_count} POIs · cohesion {c.cohesion}
                    </div>
                  </div>
                ))}
                {tab === "resolution" && duplicates.map((d, i) => (
                  <div key={i} className="px-2.5 py-2 rounded-md border border-line/60">
                    <div className="text-[11px] text-white">{d.name_a} <span className="text-muted">vs</span> {d.name_b}</div>
                    <div className="text-[9px] text-muted">{d.shared_ward} · similarity {d.similarity}%</div>
                  </div>
                ))}
                {tab === "resolution" && duplicates.length === 0 && (
                  <div className="text-[11px] text-muted">No duplicate candidates above threshold.</div>
                )}
                {tab === "hidden-links" && hiddenLinks.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { loadNode(h.person_a); }}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-white/5 border border-line/60"
                  >
                    <div className="flex justify-between text-[11px] text-white mb-1">
                      <span>{h.label_a} <span className="text-muted">&harr;</span> {h.label_b}</span>
                      <span className="data-mono text-accent">{h.score}</span>
                    </div>
                    <div className="text-[9px] text-muted">
                      {h.shared_connections} shared connections{h.shared_connection_labels?.length ? `: ${h.shared_connection_labels.slice(0, 3).join(", ")}` : ""}
                    </div>
                  </button>
                ))}
                {tab === "hidden-links" && hiddenLinks.length === 0 && (
                  <div className="text-[11px] text-muted">No high-confidence hidden links detected in the current graph.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
