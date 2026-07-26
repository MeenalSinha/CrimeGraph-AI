"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { username: "admin", role: "Admin" },
  { username: "commissioner", role: "Commissioner" },
  { username: "inspector", role: "Inspector" },
  { username: "analyst", role: "Analyst" },
  { username: "viewer", role: "Viewer" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const router = useRouter();

  async function login() {
    setError("");
    try {
      const r = await api.login(username, password);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cg_token", r.access_token);
        window.localStorage.setItem("cg_user", JSON.stringify(r.user));
      }
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials.");
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center grid-overlay">
      <div className="panel clip-corner-lg rounded-md p-8 w-[380px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-accent to-accent2 flex items-center justify-center display-font font-bold text-black">
            CG
          </div>
          <div>
            <div className="display-font text-base text-white tracking-wider">CRIMEGRAPH AI</div>
            <div className="text-[10px] text-muted tracking-widest">INTELLIGENCE DIVISION ACCESS</div>
          </div>
        </div>

        <label className="text-[10px] text-muted tracking-wider">USERNAME</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mt-1 mb-3 bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white"
        />
        <label className="text-[10px] text-muted tracking-wider">PASSWORD</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-4 bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white"
        />
        {error && <div className="text-[11px] text-red-400 mb-3">{error}</div>}
        <button
          onClick={login}
          className="w-full py-2.5 rounded-md bg-gradient-to-br from-accent to-accent2 text-black text-xs font-semibold shadow-glow mb-4"
        >
          Sign In
        </button>

        <div className="text-[10px] text-muted tracking-wider mb-2">DEMO ACCOUNTS (password: demo1234)</div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              onClick={() => setUsername(a.username)}
              className="px-2 py-1 rounded border border-line text-[10px] text-muted hover:text-white hover:border-accent/40"
            >
              {a.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
