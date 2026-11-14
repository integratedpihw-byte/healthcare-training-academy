/**
 * Small server-rendered SVG charts. Single-series (one hue, the brand teal), thin marks,
 * 4px rounded data ends, recessive grid, native <title> tooltips on every mark, and each
 * chart is paired with a data table so identity/values never depend on color alone.
 */
const INK = "#334155";
const MUTED = "#94a3b8";
const GRID = "#e2e8f0";
const MARK = "#0f766e"; // teal-700

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

export function ColumnChart({ data, label, unit = "" }: { data: { x: string; y: number }[]; label: string; unit?: string }) {
  const W = 640, H = 200, L = 36, B = 24, T = 8;
  const max = niceMax(Math.max(0, ...data.map((d) => d.y)));
  const bw = data.length ? (W - L) / data.length : 0;
  const barW = Math.max(2, Math.min(28, bw - 2));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const step = Math.ceil(data.length / 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={L} x2={W} y1={y(max * t)} y2={y(max * t)} stroke={GRID} strokeWidth={1} />
          <text x={L - 6} y={y(max * t) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{Math.round(max * t * 10) / 10}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = L + i * bw + (bw - barW) / 2;
        const h = Math.max(0, H - B - y(d.y));
        const r = Math.min(4, barW / 2, h);
        return (
          <g key={d.x}>
            <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent"><title>{`${d.x}: ${d.y}${unit}`}</title></rect>
            {h > 0 && <path d={`M${x},${H - B} V${H - B - h + r} Q${x},${H - B - h} ${x + r},${H - B - h} H${x + barW - r} Q${x + barW},${H - B - h} ${x + barW},${H - B - h + r} V${H - B} Z`} fill={MARK} pointerEvents="none" />}
            {i % step === 0 && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill={INK}>{d.x}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function BarList({ data, unit = "", max: fixedMax }: { data: { label: string; value: number | null; hint?: string }[]; unit?: string; max?: number }) {
  const max = fixedMax ?? Math.max(1, ...data.map((d) => d.value ?? 0));
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.label} className="text-sm" title={`${d.label}: ${d.value ?? "—"}${d.value != null ? unit : ""}`}>
          <div className="flex justify-between gap-2"><span className="truncate text-slate-700">{d.label}</span><span className="font-medium text-navy-900">{d.value ?? "—"}{d.value != null ? unit : ""}{d.hint && <span className="ml-1 text-xs font-normal text-slate-500">{d.hint}</span>}</span></div>
          <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, ((d.value ?? 0) / max) * 100))}%`, background: MARK }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function LineChart({ data, label, max = 100, unit = "%" }: { data: { x: string; y: number | null }[]; label: string; max?: number; unit?: string }) {
  const W = 640, H = 180, L = 36, B = 24, T = 8;
  const pts = data.filter((d) => d.y != null) as { x: string; y: number }[];
  if (pts.length < 2) return <p className="text-sm text-slate-500">Not enough history yet — a daily snapshot is recorded each night.</p>;
  const x = (i: number) => L + ((W - L - 8) * i) / (pts.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {[0, 50, 100].map((t) => (
        <g key={t}><line x1={L} x2={W} y1={y((max * t) / 100)} y2={y((max * t) / 100)} stroke={GRID} /><text x={L - 6} y={y((max * t) / 100) + 4} textAnchor="end" fontSize={10} fill={MUTED}>{(max * t) / 100}</text></g>
      ))}
      <polyline points={pts.map((p, i) => `${x(i)},${y(p.y)}`).join(" ")} fill="none" stroke={MARK} strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={p.x} cx={x(i)} cy={y(p.y)} r={4} fill={MARK} stroke="#fff" strokeWidth={2}><title>{`${p.x}: ${p.y}${unit}`}</title></circle>
      ))}
      <text x={L} y={H - 8} fontSize={10} fill={INK}>{pts[0].x}</text>
      <text x={W - 8} y={H - 8} textAnchor="end" fontSize={10} fill={INK}>{pts[pts.length - 1].x}</text>
    </svg>
  );
}
