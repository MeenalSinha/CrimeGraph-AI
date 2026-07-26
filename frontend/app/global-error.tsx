"use client";

import { useEffect } from "react";

export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In a real deployment this would ship to an error-tracking service
    // (Sentry, etc.) -- logged to console here since there's no such service
    // wired into this prototype (documented in AUDIT.md).
    console.error("CrimeGraph AI encountered an unhandled error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#050B18", color: "#E6ECF7", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{
            border: "1px solid #1B2C46", background: "rgba(13,27,48,0.85)", borderRadius: 8,
            padding: "32px 40px", maxWidth: 440, textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 6, background: "linear-gradient(135deg,#FF8A3D,#FF5A36)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              color: "#050B18", fontWeight: 700,
            }}>
              CG
            </div>
            <h1 style={{ fontSize: 15, letterSpacing: "0.15em", margin: "0 0 8px" }}>SOMETHING WENT WRONG</h1>
            <p style={{ fontSize: 13, color: "#7C8AA6", lineHeight: 1.6 }}>
              CrimeGraph AI hit an unexpected error rendering this page. This has been logged.
              You can try again, or head back to the Command Center.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "10px 20px", borderRadius: 6, border: "none",
                  background: "linear-gradient(135deg,#FF8A3D,#FF5A36)", color: "#050B18",
                  fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: "10px 20px", borderRadius: 6, border: "1px solid #1B2C46",
                  color: "#E6ECF7", fontWeight: 600, fontSize: 12, textDecoration: "none",
                  display: "inline-flex", alignItems: "center",
                }}
              >
                Command Center
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
