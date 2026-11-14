import Link from "next/link";
import { requirePermission } from "@/lib/auth/context";
import { catalogFilterSchema, listCatalog } from "@/lib/learning/learner";
import { DEPARTMENT_LABEL, ENROLLMENT_LABEL, minutes } from "@/lib/learning/labels";
import { Badge, Button, ButtonLink, EmptyState, Input, PageHeader, Select } from "@/components/ui";

export const metadata = { title: "Course Catalog" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("courses.view");
  const sp = await searchParams;
  const filter = catalogFilterSchema.safeParse({ q: sp.q || undefined, department: sp.department || undefined, required: sp.required || undefined });
  const f = filter.success ? filter.data : {};
  const rows = await ctx.tx((tx) => listCatalog(tx, ctx.user.id, f));
  const canManage = ctx.can("courses.author") || ctx.can("courses.review") || ctx.can("courses.approve.clinical") || ctx.can("courses.approve.compliance");
  return (
    <>
      <PageHeader
        title="Course Catalog"
        description="Published courses from the academy library and your organization. Internal course certificates are not state licenses or accredited continuing education unless a course says so."
        actions={canManage ? <ButtonLink href="/catalog/manage" variant="secondary">Manage courses</ButtonLink> : undefined}
      />
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4" role="search">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="text-xs font-medium text-slate-600">Search</label>
          <Input id="q" name="q" defaultValue={f.q} placeholder="Title or course ID" />
        </div>
        <div>
          <label htmlFor="department" className="text-xs font-medium text-slate-600">Department</label>
          <Select id="department" name="department" defaultValue={f.department ?? ""}>
            <option value="">All departments</option>
            {Object.entries(DEPARTMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" name="required" value="1" defaultChecked={!!f.required} /> Commonly required
        </label>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white"><EmptyState>No courses match your filters.</EmptyState></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const st = c.enrollment ? ENROLLMENT_LABEL[c.enrollment.status] : null;
            return (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">{DEPARTMENT_LABEL[c.department]}</span>
                  {st && <Badge tone={st.tone}>{st.label}</Badge>}
                </div>
                <h2 className="mt-2 text-base font-semibold text-navy-900"><Link href={`/catalog/${c.id}`} className="hover:underline">{c.title}</Link></h2>
                <p className="mt-1 text-xs text-slate-500">{c.code} · v{c.versionNumber} · {minutes(c.estimatedMinutes)} · {c.lessonCount} lessons</p>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-600">{c.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {c.isRequired && <Badge tone="amber">Commonly required</Badge>}
                  {c.certificateEligible && <Badge tone="teal">Certificate</Badge>}
                  {c.renewalMonths && <Badge>Renews every {c.renewalMonths} mo</Badge>}
                  {!c.isGlobal && <Badge tone="blue">Your organization</Badge>}
                </div>
                <div className="mt-4">
                  <ButtonLink href={c.enrollment && c.enrollment.status !== "COMPLETED" ? `/learning/${c.enrollment.id}` : `/catalog/${c.id}`} variant={c.enrollment ? "teal" : "secondary"} className="w-full">
                    {c.enrollment ? (c.enrollment.status === "COMPLETED" ? "View course" : "Continue") : "View details"}
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
