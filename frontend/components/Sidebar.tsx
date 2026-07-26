"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: OverviewIcon },
  { href: "/prediction", label: "Crime Map", icon: MapIcon },
  { href: "/network", label: "Network Graph", icon: NetworkIcon },
  { href: "/investigations", label: "Investigations", icon: CaseIcon },
  { href: "/patrol", label: "Patrol Optimizer", icon: PatrolIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/alerts", label: "Alerts", icon: AlertIcon },
  { href: "/reports", label: "Reports", icon: ReportIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-[86px] xl:w-[240px] shrink-0 h-full border-r border-line/60 flex flex-col items-center xl:items-stretch py-5 px-2 xl:px-4 bg-panel">
      <div className="flex items-center gap-2 xl:gap-3 px-1 xl:px-2 mb-8 border-b border-line/50 pb-6">
        <div className="w-10 h-10 rounded-sm bg-transparent border-2 border-blue flex items-center justify-center display-font font-bold text-xl italic text-white shadow-[0_0_10px_rgba(43,112,180,0.4)] shrink-0">
          CG
        </div>
        <div className="hidden xl:block leading-tight">
          <div className="display-font text-sm tracking-widest text-white italic">CRIMEGRAPH</div>
          <div className="text-[9px] text-blue tracking-[0.3em] mt-0.5">AI // SYSTEM</div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 px-2 xl:px-4 py-3 border border-transparent transition-all relative ${
                active ? "bg-blue/10 text-white border-blue/40 shadow-[inset_2px_0_0_#2b70b4]" : "text-muted hover:text-white hover:bg-white/5 hover:border-line"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-panel2 border border-line group-hover:border-blue/50 transition-colors">
                 <item.icon active={!!active} />
              </div>
              <span className="hidden xl:flex flex-col">
                <span className="text-[11px] uppercase tracking-widest font-semibold">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden xl:flex flex-col mt-4 px-4 py-3 border border-line/60 bg-black/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-[10px] text-emerald-400 tracking-widest font-semibold">SYSTEM ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted tracking-wider">
          <span>AI MODULE</span>
          <span className="text-white">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}

function IconShell({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      {children}
    </svg>
  );
}
function OverviewIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="1.6" />
    </IconShell>
  );
}
function MapIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <path d="M9 4L3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 4v13.5M15 6.5V20" stroke={c} strokeWidth="1.6" />
    </IconShell>
  );
}
function NetworkIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <circle cx="5" cy="6" r="2.2" stroke={c} strokeWidth="1.6" />
      <circle cx="19" cy="6" r="2.2" stroke={c} strokeWidth="1.6" />
      <circle cx="12" cy="18" r="2.2" stroke={c} strokeWidth="1.6" />
      <path d="M7 7l3 8M17 7l-3 8M7.2 6h9.6" stroke={c} strokeWidth="1.4" />
    </IconShell>
  );
}
function CaseIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <rect x="3" y="7" width="18" height="13" rx="1.5" stroke={c} strokeWidth="1.6" />
      <path d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7" stroke={c} strokeWidth="1.6" />
    </IconShell>
  );
}
function PatrolIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
    </IconShell>
  );
}
function AlertIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <path d="M12 3l9 16H3l9-16z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill={c} />
    </IconShell>
  );
}
function AnalyticsIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <path d="M4 19V10M11 19V5M18 19v-7" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 19h18" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </IconShell>
  );
}
function ReportIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <IconShell>
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke={c} strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={c} strokeWidth="1.4" />
    </IconShell>
  );
}
