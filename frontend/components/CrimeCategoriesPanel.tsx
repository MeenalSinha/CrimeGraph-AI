"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

const COLORS = ["#e57231", "#2b70b4", "#5B7FFF", "#2E5C99", "#5a6a7e", "#d35400"];

export default function CrimeCategoriesPanel() {
  const [data, setData] = useState<any>({ total: 0, categories: [] });

  useEffect(() => {
    api.crimeCategories().then(setData).catch(() => {});
  }, []);

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative z-10 px-4 py-2 border-b border-line/50 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue" />
          <span className="text-[10px] tracking-widest text-white uppercase font-mono">Top Crime Categories</span>
        </div>
      </div>
      
      <div className="relative z-10 flex-1 p-4 flex items-center gap-4">
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.categories} dataKey="count" innerRadius={34} outerRadius={52} paddingAngle={2}>
                {data.categories.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#050B18" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="data-mono text-base text-white">{data.total}</span>
            <span className="text-[8px] text-muted tracking-wider">TOTAL</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.categories.map((c: any, i: number) => (
            <div key={c.label} className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-none" style={{ background: COLORS[i % COLORS.length] }} />
                {c.label.toUpperCase()}
              </span>
              <span className="text-blue data-mono">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
