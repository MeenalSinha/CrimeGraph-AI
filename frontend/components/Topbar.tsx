"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";



export default function Topbar({ title, cityName = "Novagarh" }: { title: string; cityName?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  async function onSearch(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const r = await api.search(value);
      setResults(r.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    }
  }

  return (
    <header className="h-14 bg-panel border-b border-line flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] tracking-widest text-muted font-mono">SYSTEM STATUS</span>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" /> OPERATIONAL
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 border-l border-line pl-6">
          <span className="text-[9px] tracking-widest text-muted font-mono">CUSTOM/SCALE</span>
          <select className="bg-transparent text-[11px] text-blue border-none focus:ring-0 outline-none font-mono">
            <option>100%</option>
            <option>75%</option>
            <option>50%</option>
          </select>
        </div>
      </div>



      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            aria-label="Search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search..."
            className="w-48 bg-panel2 border border-line rounded-none pl-8 pr-3 py-1 text-[10px] font-mono text-white placeholder:text-muted focus:outline-none focus:border-blue"
          />
          <svg className="absolute left-2.5 top-1.5" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#2b70b4" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="#2b70b4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {open && results.length > 0 && (
            <div className="absolute mt-1 w-full bg-panel border border-blue/50 rounded-none max-h-64 overflow-y-auto z-40 shadow-blueglow">
              {results.map((r, i) => (
                <div key={i} className="px-3 py-2 text-xs border-b border-line hover:bg-blue/10 cursor-pointer">
                  <div className="text-white">{r.label}</div>
                  <div className="text-blue/70 text-[9px] uppercase tracking-wide font-mono">{r.type} -- {r.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button aria-label="Notifications" className="relative text-muted hover:text-blue transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent2 rounded-full border border-panel" />
        </button>
        <button aria-label="Profile" className="text-muted hover:text-blue transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
