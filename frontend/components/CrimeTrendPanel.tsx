"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "@/lib/api";

export default function CrimeTrendPanel() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api.crimeTrend().then((d) => {
      const thisWeek = d.this_week || [];
      const lastWeek = d.last_week || [];
      const merged = thisWeek.map((t: any, i: number) => ({
        day: new Date(t.date).toLocaleDateString(undefined, { weekday: "short" }),
        thisWeek: t.count,
        lastWeek: lastWeek[i]?.count ?? null,
      }));
      setData(merged);
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative z-10 px-4 py-2 border-b border-line/50 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue" />
          <span className="text-[10px] tracking-widest text-white uppercase font-mono">Crime Trend</span>
        </div>
      </div>
      
      <div className="relative z-10 flex-1 p-4 flex flex-col min-h-[160px]">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1B2C46" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#5a6a7e" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#5a6a7e" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0A1526", border: "1px solid #1B2C46", fontSize: 11 }} />
              <Line type="monotone" dataKey="thisWeek" stroke="#2b70b4" strokeWidth={2} dot={false} name="This week" />
              <Line type="monotone" dataKey="lastWeek" stroke="#e57231" strokeWidth={2} dot={false} strokeDasharray="4 3" name="Last week" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-muted font-mono tracking-wider">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue inline-block" /> THIS WEEK</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-accent inline-block" /> LAST WEEK</span>
        </div>
      </div>
    </div>
  );
}
