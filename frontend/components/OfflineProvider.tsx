"use client";

import { useEffect, useState } from "react";

/**
 * Mounts once in the root layout. Registers the offline-mode service worker
 * (public/sw.js) and surfaces a small banner whenever the browser goes
 * offline, so an officer using the platform in a low-connectivity area knows
 * they're looking at cached data rather than assuming it's live.
 */
export default function OfflineProvider() {
  const [online, setOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setSwReady(true))
        .catch(() => setSwReady(false));
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-accent2/90 text-black text-[11px] font-medium px-4 py-2 flex items-center justify-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
      OFFLINE -- showing last cached data{swReady ? "" : " (offline cache unavailable in this browser)"}
    </div>
  );
}
