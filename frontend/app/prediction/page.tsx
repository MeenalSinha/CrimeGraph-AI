"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import HeatmapPanel from "@/components/HeatmapPanel";
import { api } from "@/lib/api";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PredictionPage() {
  const [wards, setWards] = useState<string[]>([]);
  const [ward, setWard] = useState("");
  const [hour, setHour] = useState(21);
  const [weekday, setWeekday] = useState(4);
  const [weather, setWeather] = useState("Clear");
  const [weatherOptions, setWeatherOptions] = useState<string[]>(["Clear"]);
  const [isFestivalDay, setIsFestivalDay] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioKey, setScenarioKey] = useState("");
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.wards().then((d) => {
      setWards(d.wards || []);
      if (d.wards?.length) setWard(d.wards[0]);
    });
    api.weatherOptions().then((d) => setWeatherOptions(d.options || ["Clear"]));
    api.scenarios().then((d) => {
      setScenarios(d.scenarios || []);
      if (d.scenarios?.length) setScenarioKey(d.scenarios[0].key);
    });
  }, []);

  async function runPrediction() {
    if (!ward) return;
    setLoading(true);
    try {
      const [r, f] = await Promise.all([api.predictRisk(ward, hour, weekday, weather, isFestivalDay), api.forecast(ward)]);
      setResult(r);
      setForecast(f.forecast || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ward) runPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ward]);

  async function runScenario() {
    if (!ward || !scenarioKey) return;
    const r = await api.simulateScenario(ward, scenarioKey);
    setScenarioResult(r);
  }

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Crime Prediction Engine" />
        <main className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
          <div className="flex flex-col gap-4">
            <div className="panel clip-corner rounded-md p-4">
              <div className="text-xs tracking-wider text-white uppercase font-medium mb-3">Prediction Inputs</div>

              <label className="text-[10px] text-muted tracking-wider">WARD</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full mt-1 mb-3 bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white"
              >
                {wards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="text-[10px] text-muted tracking-wider">HOUR OF DAY: {hour}:00</label>
              <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full accent-accent mb-3" />

              <label className="text-[10px] text-muted tracking-wider">WEEKDAY: {WEEKDAYS[weekday]}</label>
              <input type="range" min={0} max={6} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="w-full accent-accent mb-3" />

              <label className="text-[10px] text-muted tracking-wider">WEATHER</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full mt-1 mb-3 bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white"
              >
                {weatherOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFestivalDay}
                  onChange={(e) => setIsFestivalDay(e.target.checked)}
                  className="accent-accent"
                />
                <span className="text-[10px] text-muted tracking-wider">FESTIVAL DAY</span>
              </label>

              <button
                onClick={runPrediction}
                disabled={loading}
                className="w-full py-2 rounded-md bg-gradient-to-br from-accent to-accent2 text-black text-xs font-semibold shadow-glow disabled:opacity-50"
              >
                {loading ? "Running model..." : "Run Prediction"}
              </button>
            </div>

            {result && (
              <div className="panel clip-corner rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs tracking-wider text-white uppercase font-medium">Risk Result</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-accent/40 text-accent">{result.risk_band}</span>
                </div>
                <div className="text-3xl display-font text-white mb-1">{result.risk_score}<span className="text-sm text-muted">/100</span></div>
                <div className="text-[11px] text-muted mb-3">Confidence: {result.confidence}%</div>

                <div className="text-[10px] text-muted tracking-wider mb-1">LIKELY CRIME TYPES</div>
                <div className="space-y-1 mb-3">
                  {result.likely_crime_types?.map((t: any) => (
                    <div key={t.crime_type} className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{t.crime_type}</span>
                      <span className="data-mono text-muted">{(t.probability * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-muted tracking-wider mb-1">EXPLAINABILITY</div>
                <ul className="space-y-1.5">
                  {result.explanation?.reasons?.map((r: string, i: number) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-1.5">
                      <span className="text-accent">--</span>{r}
                    </li>
                  ))}
                </ul>
                <div className="text-[9px] text-muted mt-3 pt-2 border-t border-line">
                  Model: {result.explanation?.model} · Trained on {result.explanation?.trained_on_incidents} incidents · R2 {result.explanation?.model_r2}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="h-[360px]"><HeatmapPanel /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="panel clip-corner rounded-md p-4">
                <div className="text-xs tracking-wider text-white uppercase font-medium mb-2">7-Day Risk Forecast -- {ward}</div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast}>
                      <CartesianGrid stroke="#1B2C46" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day_name" stroke="#7C8AA6" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7C8AA6" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0A1526", border: "1px solid #1B2C46", fontSize: 11 }} />
                      <Bar dataKey="risk_score" fill="#3FA9FF" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel clip-corner rounded-md p-4">
                <div className="text-xs tracking-wider text-white uppercase font-medium mb-2">Scenario Simulator</div>
                <select
                  value={scenarioKey}
                  onChange={(e) => setScenarioKey(e.target.value)}
                  className="w-full mb-2 bg-black/30 border border-line rounded-md px-3 py-2 text-xs text-white"
                >
                  {scenarios.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <button
                  onClick={runScenario}
                  className="w-full py-1.5 rounded-md border border-blue/40 text-blue text-xs font-medium mb-3 hover:bg-blue/10"
                >
                  Simulate
                </button>
                {scenarioResult && (
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted">Baseline</span>
                      <span className="data-mono text-white">{scenarioResult.baseline_risk_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Adjusted</span>
                      <span className="data-mono text-accent">{scenarioResult.adjusted_risk_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Delta</span>
                      <span className="data-mono text-white">{scenarioResult.delta > 0 ? "+" : ""}{scenarioResult.delta}</span>
                    </div>
                    <p className="text-muted pt-1">{scenarioResult.note}</p>
                    <p className="text-slate-300 pt-1">{scenarioResult.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
