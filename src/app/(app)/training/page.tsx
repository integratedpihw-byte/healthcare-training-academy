import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAnyPermission } from "@/lib/auth/context";
import { assignableCourses, assignmentFilterSchema, assignmentStats, listAssignments, SOURCE_LABELS } from "@/lib/workforce/assignments";
import { employeeFormOptions } from "@/lib/workforce/employees";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { AssignmentBadge, DueDate, SubNav, TRAINING_TABS } from "@/components/workforce/common";

export const metadata = { title: "Training Management" };

const STATUS_FILTERS: [string, string][] = [
  ["OPEN", "Open (assigned, in progress, overdue)"],
  ["OVERDUE", "Overdue"],
  ["DUE_SOON", "Due within 30 days"],
  ["IN_PROGRESS", "In progress"],
  ["ASSIGNED", "Not started"],
  ["COMPLETED", "Completed"],
  ["WAIVED", "Waived"],
  ["CANCELLED", "Cancelled"],
  ["ALL", "All"],
];

export default async function TrainingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAnyPermission(["training.view_all", "training.assign", "training.requirements.manage"]);
  if (!ctx.can("training.view_all") && !ctx.can("training.assign")) redirect("/training/requirements");
  const sp = await searchParams;
  const p = assignmentFilterSchema.safeParse({ status: sp.status || undefined, facilityId: sp.facilityId || undefined, courseId: sp.courseId || undefined, q: sp.q || undefined });
  const f = p.success ? p.data : {};
  const d = await ctx.tx(async (tx) => ({
    rows: await listAssignments(tx, f),
    stats: await assignmentStats(tx),
    courses: await assignableCourses(tx),
    facilities: (await employeeFormOptions(tx, ctx.access)).allFacilities,
  }));
  return (
    <>
      <PageHeader title="Training Management" description="Required and assigned training across the employees in your scope. Assignments complete automatically when the employee completes the course, including every mandatory exam." />
      <SubNav items={TRAINING_TABS((x) => ctx.can(x as never))} active="/training" />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Open assignments" value={d.stats.open} />
        <StatCard label="Overdue" value={d.stats.overdue} tone="red" />
        <StatCard label="Due in 30 days" value={d.stats.due_soon} tone="amber" />
        <StatCard label="Completed (30 days)" value={d.stats.completed_30} tone="teal" />
      </div>
      <Card>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><label htmlFor="q" className="text-xs font-medium text-slate-600">Search</label><Input id="q" name="q" defaultValue={sp.q} placeholder="Employee, ID or course" /></div>
          <div><label htmlFor="status" className="text-xs font-medium text-slate-600">Status</label><Select id="status" name="status" defaultValue={sp.status ?? "OPEN"}>{STATUS_FILTERS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></div>
          <div><label htmlFor="facilityId" className="text-xs font-medium text-slate-600">Facility</label><Select id="facilityId" name="facilityId" defaultValue={sp.facilityId ?? ""}><option value="">All in scope</option>{d.facilities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></div>
          <div><label htmlFor="courseId" className="text-xs font-medium text-slate-600">Course</label><Select id="courseId" name="courseId" defaultValue={sp.courseId ?? ""}><option value="">All courses</option>{d.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></div>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
        <Table head={["Employee", "Course", "Due", "Progress", "Status", ""]} empty={d.rows.length === 0 ? <EmptyState>No assignments match.</EmptyState> : undefined}>
          {d.rows.map((a) => {
            const open = ["ASSIGNED", "IN_PROGRESS", "OVERDUE"].includes(a.status);
            return (
              <tr key={a.id}>
                <Td>
                  <Link href={`/employees/${a.employeeId}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">{a.employeeName}</Link>
                  <div className="text-xs text-slate-500">{a.jobTitle} · {a.facilityName ?? "—"}</div>
                  {!a.hasAccount && <Badge tone="amber">No account</Badge>}
                </Td>
                <Td>{a.courseTitle}<div className="text-xs text-slate-500">{a.courseCode} · {SOURCE_LABELS[a.source]}</div></Td>
                <Td className="whitespace-nowrap">{a.status === "COMPLETED" ? <span className="text-xs text-slate-500">Completed</span> : <DueDate date={a.dueDate} open={open} />}</Td>
                <Td>{a.progressPct != null ? `${a.progressPct}%` : "—"}</Td>
                <Td><AssignmentBadge status={a.status} /></Td>
                <Td className="text-right"><Link href={`/training/assignments/${a.id}`} className="text-sm font-semibold text-teal-700 hover:underline">Details</Link></Td>
              </tr>
            );
          })}
        </Table>
        {d.rows.length >= 1000 && <p className="mt-2 text-xs text-slate-500">Showing the first 1,000 results — narrow the filters.</p>}
      </Card>
    </>
  );
}
