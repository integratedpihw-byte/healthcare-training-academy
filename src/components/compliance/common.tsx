import { Badge } from "@/components/ui";
import { ITEM_LABEL, RULE_STATE_LABEL, type ItemStatus, type RuleState } from "@/lib/compliance/engine";
import { SubNav } from "@/components/workforce/common";

export function RuleStateBadge({ state }: { state: RuleState }) {
  const s = RULE_STATE_LABEL[state];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ItemBadge({ status }: { status: ItemStatus }) {
  const s = ITEM_LABEL[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function VerificationBadge({ status }: { status: string }) {
  return status === "VERIFIED" ? <Badge tone="green">Source verified</Badge> : status === "SUPERSEDED" ? <Badge>Superseded</Badge> : <Badge tone="amber">Needs review</Badge>;
}

export function Pct({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-500">—</span>;
  const tone = value >= 90 ? "text-emerald-700" : value >= 75 ? "text-amber-700" : "text-red-700";
  return <span className={`font-semibold ${tone}`}>{value}%</span>;
}

export function ComplianceTabs({ active }: { active: string }) {
  return (
    <SubNav
      active={active}
      items={[
        { href: "/compliance", label: "Overview" },
        { href: "/compliance/rules", label: "Regulatory library" },
        { href: "/reports", label: "Audit reports" },
      ]}
    />
  );
}

/** Tiny dependency-free trend chart (SVG) for compliance snapshots. */
export function TrendChart({ points }: { points: { date: string; pct: number | null }[] }) {
  const data = points.filter((p) => p.pct != null) as { date: string; pct: number }[];
  if (data.length < 2) return <p className="text-sm text-slate-500">The trend appears after the daily job has recorded at least two snapshots.</p>;
  const W = 560, H = 140, P = 24;
  const x = (i: number) => P + (i / (data.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / 100) * (H - 2 * P);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.pct).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Compliance trend from ${data[0].date} (${data[0].pct}%) to ${data[data.length - 1].date} (${data[data.length - 1].pct}%)`}>
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="#e2e8f0" />
          <text x={2} y={y(g) + 4} fontSize="9" fill="#64748b">{g}%</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#13a3b0" strokeWidth="2.5" />
      {data.map((d, i) => <circle key={d.date} cx={x(i)} cy={y(d.pct)} r="3" fill="#0b2545"><title>{`${d.date}: ${d.pct}%`}</title></circle>)}
    </svg>
  );
}
