export default function KpiCard({
  label, value, change, icon,
}: { label: string; value: string | number; change?: number; icon: React.ReactNode }) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="bg-panel relative overflow-hidden p-4 border border-line/60 flex items-center justify-between min-w-[200px] flex-1 group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-none bg-blue/70" />
          <div className="text-[10px] tracking-widest text-muted uppercase font-mono">{label}</div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="display-font text-3xl text-white font-bold tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{value}</span>
          {change !== undefined && (
            <span className={`text-[11px] font-mono tracking-wider ${positive ? "text-emerald-400" : "text-red-400"}`}>
              {positive ? "+" : ""}{change}%
            </span>
          )}
        </div>
      </div>
      <div className="relative z-10 w-10 h-10 rounded-sm bg-panel2 border border-line flex items-center justify-center text-blue/70 shrink-0 group-hover:text-blue transition-colors">
        {icon}
      </div>
    </div>
  );
}
