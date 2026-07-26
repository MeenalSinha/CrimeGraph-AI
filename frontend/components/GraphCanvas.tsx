"use client";

import { useEffect, useRef, useState } from "react";
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from "d3-force";

const TYPE_COLOR: Record<string, string> = {
  person: "#2b70b4",
  vehicle: "#e57231",
  phone: "#5B7FFF",
  account: "#2ED9A8",
  crime: "#d35400",
};

export default function GraphCanvas({
  nodes, edges, onNodeClick, width = 700, height = 460,
}: { nodes: any[]; edges: any[]; onNodeClick?: (id: string) => void; width?: number; height?: number }) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const simRef = useRef<any>(null);

  useEffect(() => {
    if (!nodes.length) {
      setPositions({});
      return;
    }
    const simNodes = nodes.map((n) => ({ ...n }));
    const simLinks = edges
      .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
      .map((e) => ({ ...e }));

    const sim = forceSimulation(simNodes as any)
      .force("charge", forceManyBody().strength(-160))
      .force("link", forceLink(simLinks as any).id((d: any) => d.id).distance(70))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(22))
      .stop();

    for (let i = 0; i < 220; i++) sim.tick();

    const pos: Record<string, { x: number; y: number }> = {};
    simNodes.forEach((n: any) => {
      pos[n.id] = { x: n.x, y: n.y };
    });
    setPositions(pos);
    simRef.current = sim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <g opacity={0.5}>
        {edges.map((e, i) => {
          const s = positions[e.source];
          const t = positions[e.target];
          if (!s || !t) return null;
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#2A3F63" strokeWidth={1} />;
        })}
      </g>
      <g>
        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          const color = TYPE_COLOR[n.type] || "#5a6a7e";
          const r = n.type === "person" ? (n.is_poi ? 10 : 7) : 6;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" onClick={() => onNodeClick?.(n.id)}>
              {n.is_poi && <circle r={r + 5} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={2} />}
              <circle r={r} fill={color} stroke="#050B18" strokeWidth={1.5} />
              <text y={r + 11} textAnchor="middle" fontSize={8.5} fill="#9AAAC7">
                {(n.label || n.id).toString().slice(0, 14)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
