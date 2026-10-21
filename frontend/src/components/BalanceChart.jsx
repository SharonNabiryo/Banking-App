import { useMemo, useState } from "react";
import { money, shortDate } from "../lib/format.js";

const W = 600, H = 180, PAD = 8;

export default function BalanceChart({ series }) {
  const [hover, setHover] = useState(null);
  const pts = useMemo(() => {
    if (!series?.length) return [];
    const values = series.map((p) => p.balanceCents);
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    return series.map((p, i) => ({
      ...p,
      x: PAD + (i / Math.max(1, series.length - 1)) * (W - PAD * 2),
      y: H - PAD - ((p.balanceCents - min) / span) * (H - PAD * 2 - 20),
    }));
  }, [series]);

  if (!pts.length) return null;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1).x},${H} L${pts[0].x},${H} Z`;
  const active = hover != null ? pts[hover] : pts.at(-1);

  return (
    <div className="relative">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-muted">{shortDate(active.date + "T12:00:00")}</span>
        <span className="money font-medium">{money(active.balanceCents)}</span>
      </div>
      <div className="relative h-44">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full touch-none"
        preserveAspectRatio="none"
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1));
          setHover(Math.max(0, Math.min(pts.length - 1, i)));
        }}
        role="img"
        aria-label="Total balance over the last 30 days"
      >
        <defs>
          <linearGradient id="bal-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c2703d" stopOpacity=".35" />
            <stop offset="1" stopColor="#c2703d" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#bal-fill)" />
        <path d={line} fill="none" stroke="#c2703d" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <line x1={active.x} x2={active.x} y1="0" y2={H} stroke="#0e2620" strokeOpacity=".15" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-copper-500 shadow"
        style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%` }} />
      </div>
    </div>
  );
}
