const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const api = {
  kpis: () => request<any>("/api/dashboard/kpis"),
  crimeTrend: () => request<any>("/api/dashboard/crime-trend"),
  crimeCategories: () => request<any>("/api/dashboard/crime-categories"),
  heatmap: () => request<any>("/api/dashboard/heatmap"),
  graphSummary: () => request<any>("/api/dashboard/graph-summary"),
  alerts: () => request<any>("/api/alerts/"),

  wards: () => request<any>("/api/prediction/wards"),
  weatherOptions: () => request<any>("/api/prediction/weather-options"),
  predictRisk: (ward: string, hour: number, weekday: number, weather = "Clear", is_festival_day = false) =>
    request<any>("/api/prediction/risk", { method: "POST", body: JSON.stringify({ ward, hour, weekday, weather, is_festival_day }) }),
  hotspots: () => request<any>("/api/prediction/hotspots"),
  forecast: (ward: string) => request<any>(`/api/prediction/forecast/${encodeURIComponent(ward)}`),

  networkStats: () => request<any>("/api/network/stats"),
  networkNode: (id: string) => request<any>(`/api/network/node/${encodeURIComponent(id)}`),
  networkExpand: (id: string, depth = 1, limit = 40) =>
    request<any>(`/api/network/expand/${encodeURIComponent(id)}?depth=${depth}&limit=${limit}`),
  shortestPath: (source: string, target: string) =>
    request<any>("/api/network/shortest-path", { method: "POST", body: JSON.stringify({ source, target }) }),
  centrality: (topN = 15) => request<any>(`/api/network/centrality?top_n=${topN}`),
  communities: (minSize = 3) => request<any>(`/api/network/communities?min_size=${minSize}`),
  entityResolution: (threshold = 82) => request<any>(`/api/network/entity-resolution?threshold=${threshold}`),
  linkPrediction: (personId?: string, topN = 15) =>
    request<any>(`/api/network/link-prediction?${personId ? `person_id=${encodeURIComponent(personId)}&` : ""}top_n=${topN}`),

  districtComparison: () => request<any>("/api/analytics/district-comparison"),
  officerProductivity: () => request<any>("/api/analytics/officer-productivity"),
  crimeRecurrence: () => request<any>("/api/analytics/crime-recurrence"),
  anomalies: () => request<any>("/api/analytics/anomalies"),

  patrolOptimize: () => request<any>("/api/patrol/optimize"),

  cases: (status?: string, ward?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (ward) params.set("ward", ward);
    return request<any>(`/api/investigations/cases?${params.toString()}`);
  },
  caseDetail: (firId: string) => request<any>(`/api/investigations/cases/${encodeURIComponent(firId)}`),

  search: (q: string) => request<any>(`/api/search/?q=${encodeURIComponent(q)}`),

  chat: (query: string) => request<any>("/api/chat/ask", { method: "POST", body: JSON.stringify({ query }) }),

  scenarios: () => request<any>("/api/scenario/list"),
  simulateScenario: (ward: string, scenario_key: string) =>
    request<any>("/api/scenario/simulate", { method: "POST", body: JSON.stringify({ ward, scenario_key }) }),

  login: (username: string, password: string) =>
    request<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  reportUrl: (kind: "crime-trend" | "patrol" | "network", format: "pdf" | "csv" = "pdf") =>
    `${API_BASE}/api/reports/${kind}.${format}`,
};

export { API_BASE };
