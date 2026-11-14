import Link from "next/link";
import { Badge, cn } from "@/components/ui";
import { COMPLIANCE_LABEL, type ComplianceStatus } from "@/lib/workforce/rules";
import { ASSIGNMENT_LABELS } from "@/lib/workforce/assignments";

export function SubNav({ items, active }: { items: { href: string; label: string; show?: boolean }[]; active: string }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Section">
      {items
        .filter((i) => i.show !== false)
        .map((i) => (
          <Link key={i.href} href={i.href} aria-current={active === i.href ? "page" : undefined} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", active === i.href ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50")}>
            {i.label}
          </Link>
        ))}
    </nav>
  );
}

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const c = COMPLIANCE_LABEL[status];
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export function AssignmentBadge({ status }: { status: string }) {
  const s = ASSIGNMENT_LABELS[status] ?? { label: status, tone: "gray" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Due date with a relative hint ("in 5 days", "12 days overdue"). */
export function DueDate({ date, open }: { date: string | null; open: boolean }) {
  if (!date) return <span className="text-slate-500">No due date</span>;
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (!open) return <span>{label}</span>;
  return (
    <span>
      {label}
      <span className={cn("block text-xs", days < 0 ? "font-semibold text-red-700" : days <= 30 ? "text-amber-700" : "text-slate-500")}>
        {days < 0 ? `${-days} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `in ${days} day${days === 1 ? "" : "s"}`}
      </span>
    </span>
  );
}

export const TRAINING_TABS = (can: (p: string) => boolean) => [
  { href: "/training", label: "Assignments", show: can("training.view_all") || can("training.assign") },
  { href: "/training/assign", label: "Assign training", show: can("training.assign") },
  { href: "/training/requirements", label: "Requirements & pathways", show: can("training.requirements.manage") || can("training.assign") },
  { href: "/training/expirations", label: "Expirations", show: can("training.view_all") || can("training.assign") },
];
