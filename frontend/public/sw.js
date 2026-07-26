/**
 * CrimeGraph AI service worker -- offline-first mode.
 *
 * Strategy:
 *  - App shell (the Next.js static build output + core pages) is precached on
 *    install and served cache-first, so navigation works with no connection.
 *  - Backend GET API calls (dashboard, heatmap, alerts, prediction, network,
 *    investigations, search) use stale-while-revalidate: if there's a cached
 *    response, serve it immediately (fast, and works offline) while
 *    refetching in the background to keep the cache fresh for next time.
 *  - Non-GET requests (login, chat, patrol optimize POST, scenario simulate)
 *    always go to the network -- they're not meaningfully cacheable, and
 *    silently serving stale data for an action would be actively misleading
 *    for a police operations tool.
 *
 * Honesty note (see AUDIT.md): this gives the officer a real "last known
 * state" view when connectivity drops -- KPIs, the last heatmap snapshot,
 * alerts, case lists -- which is the actually useful part of "offline-first"
 * for a field tool. It does not queue writes made while offline for later
 * sync (no offline case editing / background sync); that would need a
 * durable local write-ahead log and conflict resolution strategy this
 * prototype doesn't implement.
 */

const CACHE_VERSION = "crimegraph-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

const APP_SHELL_URLS = [
  "/dashboard",
  "/prediction",
  "/network",
  "/investigations",
  "/patrol",
  "/alerts",
  "/reports",
  "/login",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

const CACHEABLE_API_PREFIXES = [
  "/api/dashboard",
  "/api/prediction",
  "/api/network",
  "/api/alerts",
  "/api/investigations",
  "/api/search",
  "/api/patrol/optimize", // GET variant only; POST is excluded below by method check
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(APP_SHELL_URLS).catch(() => {
        // Best-effort precache -- some routes may not exist yet in dev; that's fine.
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("crimegraph-") && k !== APP_SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCacheableApiRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return CACHEABLE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response(
    JSON.stringify({ offline: true, detail: "No cached data available for this request yet." }),
    { headers: { "Content-Type": "application/json" }, status: 503 }
  );
}

async function cacheFirstAppShell(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const offlinePage = await cache.match("/offline.html");
    return offlinePage || new Response("Offline and no cached page available.", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isCacheableApiRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Only handle same-origin navigation/document requests for the app shell;
  // let everything else (including cross-origin API calls that aren't
  // GET-cacheable, e.g. POST /api/chat/ask) pass straight through to the
  // network untouched.
  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(cacheFirstAppShell(request));
  }
});
