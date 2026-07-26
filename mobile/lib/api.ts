import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE =
  (Constants.expoConfig?.extra as any)?.apiBase ||
  process.env.EXPO_PUBLIC_API_BASE ||
  "http://localhost:8000";

const CACHE_PREFIX = "crimegraph_cache::";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours -- stale cache is still shown if offline beyond this

let tokenCache: string | null = null;

export async function getToken(): Promise<string | null> {
  if (tokenCache) return tokenCache;
  tokenCache = await AsyncStorage.getItem("crimegraph_token");
  return tokenCache;
}

export async function setToken(token: string | null) {
  tokenCache = token;
  if (token) await AsyncStorage.setItem("crimegraph_token", token);
  else await AsyncStorage.removeItem("crimegraph_token");
}

/**
 * Offline-first GET: tries the network first (short timeout), and on any
 * failure -- no connectivity, DNS failure, timeout -- falls back to the last
 * successful response cached in AsyncStorage, tagged with how old it is so
 * the UI can show "cached Xm ago" instead of silently presenting stale data
 * as live. This is the mobile companion's equivalent of the web app's
 * service-worker stale-while-revalidate strategy (see frontend/public/sw.js).
 */
async function offlineFirstGet<T>(path: string): Promise<{ data: T; fromCache: boolean; cachedAt: number | null }> {
  const cacheKey = CACHE_PREFIX + path;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const token = await getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }));
    return { data, fromCache: false, cachedAt: null };
  } catch (err) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { data: parsed.data, fromCache: true, cachedAt: parsed.cachedAt };
    }
    throw err;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  base: API_BASE,

  login: (username: string, password: string) => postJson<any>("/api/auth/login", { username, password }),

  kpis: () => offlineFirstGet<any>("/api/dashboard/kpis"),
  heatmap: () => offlineFirstGet<any>("/api/dashboard/heatmap"),
  alerts: () => offlineFirstGet<any>("/api/alerts/"),
  graphSummary: () => offlineFirstGet<any>("/api/dashboard/graph-summary"),

  cases: (status?: string) => offlineFirstGet<any>(`/api/investigations/cases${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  caseDetail: (firId: string) => offlineFirstGet<any>(`/api/investigations/cases/${encodeURIComponent(firId)}`),

  hotspots: () => offlineFirstGet<any>("/api/prediction/hotspots"),
  centrality: () => offlineFirstGet<any>("/api/network/centrality?top_n=10"),
  communities: () => offlineFirstGet<any>("/api/network/communities?min_size=3"),

  chat: (query: string) => postJson<any>("/api/chat/ask", { query }),
};

export { CACHE_TTL_MS };
