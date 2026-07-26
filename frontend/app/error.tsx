"use client";

import { useEffect } from "react";

export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CrimeGraph AI page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="panel clip-corner-lg rounded-md p-8 max-w-md text-center">
        <div className="w-11 h-11 rounded-md bg-gradient-to-br from-accent to-accent2 flex items-center justify-center display-font font-bold text-black mx-auto mb-4">
          CG
        </div>
        <h1 className="text-sm tracking-widest text-white mb-2">SOMETHING WENT WRONG</h1>
        <p className="text-[13px] text-muted leading-relaxed mb-5">
          This page hit an unexpected error. It's been logged. You can retry, or head back to
          the Command Center.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-md bg-gradient-to-br from-accent to-accent2 text-black text-xs font-semibold shadow-glow"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-md border border-line text-white text-xs font-semibold flex items-center"
          >
            Command Center
          </a>
        </div>
      </div>
    </div>
  );
}
