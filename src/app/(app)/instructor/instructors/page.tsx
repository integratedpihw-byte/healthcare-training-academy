import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { courses } from "@/db/schema";
import { listInstructors, memberOptions } from "@/lib/instructors/service";
import type { Credential } from "@/lib/instructors/service";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, fmtDate } from "@/components/ui";
import { InstructorNav } from "../nav";
import { addInstructorAction, assignCourseAction, instructorActiveAction, issueInstructorCertificateAction, setRateAction, unassignCourseAction } from "../class-actions";
import { RATE_TYPE_LABEL, ratesFor } from "@/lib/instructors/compensation";
import { usd } from "@/lib/billing/commerce";

export const metadata = { title: "Instructors" };

export default async function InstructorsPage() {
  const ctx = await requirePermission("instructors.manage");
  const d = await ctx.tx(async (tx) => ({
    list: await listInstructors(tx),
    members: await memberOptions(tx),
    courses: await tx.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "PUBLISHED")).orderBy(asc(courses.title)),
    rates: await ratesFor(tx),
  }));
  const existing = new Set(d.list.map((r) => r.i.userId));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Instructor Portal" description="Instructor profiles, qualifications, credentials and course assignments. Credentials are recorded by your organization and are not verified by the platform." />
      <InstructorNav ctx={ctx} active="instructors" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {d.list.length === 0 && <Card><EmptyState>No instructors yet. Add one from your members.</EmptyState></Card>}
          {d.list.map((r) => {
            const creds = (r.i.credentials ?? []) as Credential[];
            const assigned = new Set(r.courses.map((c) => c.courseId));
            return (
              <Card key={r.i.id} title={<span>{r.first} {r.last} {!r.i.isActive && <Badge tone="gray">inactive</Badge>}</span>} actions={<Link href={`/instructor/profile?id=${r.i.id}`} className="text-sm font-semibold text-teal-700 hover:underline">Edit profile</Link>}>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">{r.i.title ?? "Instructor"} · {r.email}</div>
                    {r.i.qualifications?.length ? <ul className="mt-2 list-disc pl-5">{r.i.qualifications.map((q) => <li key={q}>{q}</li>)}</ul> : <p className="mt-2 text-slate-500">No qualifications recorded.</p>}
                    {creds.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {creds.map((c, k) => <li key={k}><span className="font-medium">{c.name}</span> — {c.issuer}{c.number ? ` #${c.number}` : ""}{c.expiresOn && <> · <span className={c.expiresOn < today ? "font-semibold text-red-700" : ""}>{c.expiresOn < today ? "expired" : "expires"} {fmtDate(c.expiresOn)}</span></>}</li>)}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Assigned courses</div>
                    {r.courses.length === 0 ? <p className="text-slate-500">None</p> : (
                      <ul className="mt-1 space-y-1">
                        {r.courses.map((c) => (
                          <li key={c.courseId} className="flex items-center justify-between gap-2">
                            <span>{c.title}</span>
                            <form action={unassignCourseAction}><input type="hidden" name="instructorId" value={r.i.id} /><input type="hidden" name="courseId" value={c.courseId} /><button className="text-xs text-red-700 hover:underline" aria-label={`Remove ${c.title}`}>Remove</button></form>
                          </li>
                        ))}
                      </ul>
                    )}
                    <ActionForm action={assignCourseAction} submitLabel="Assign course" variant="secondary" className="mt-2 flex items-end gap-2">
                      <input type="hidden" name="instructorId" value={r.i.id} />
                      <Select name="courseId" aria-label={`Course to assign to ${r.first} ${r.last}`} required>{d.courses.filter((c) => !assigned.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>
                    </ActionForm>
                    {ctx.can("certificates.issue") && r.courses.length > 0 && r.i.isActive && (
                      <ActionForm action={issueInstructorCertificateAction} submitLabel="Issue instructor certificate" variant="secondary" className="mt-3 space-y-2" confirm="Issue an instructor certificate? It is recorded permanently and can be verified publicly.">
                        <input type="hidden" name="instructorId" value={r.i.id} />
                        <Select name="courseId" aria-label={`Course for ${r.first} ${r.last}'s instructor certificate`} required>{r.courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}</Select>
                        <Input name="hours" type="number" min={0} max={500} step="0.5" defaultValue={0} aria-label="Instructor training hours completed" />
                        <p className="text-xs text-slate-500">Hours of instructor preparation completed (0 if none). This records your organization&apos;s authorization to teach; it is not a teaching license.</p>
                      </ActionForm>
                    )}
                  </div>
                </div>
                <details className="mt-3 rounded-md border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-navy-900">
                    Compensation{(() => { const cur = d.rates.find((x) => x.instructorId === r.i.id && x.effectiveFrom <= today); return cur ? `: ${usd(cur.rateCents)} ${RATE_TYPE_LABEL[cur.rateType].toLowerCase()}` : ": no rate on file"; })()}
                  </summary>
                  {d.rates.filter((x) => x.instructorId === r.i.id).length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {d.rates.filter((x) => x.instructorId === r.i.id).map((x) => <li key={x.id}>From {fmtDate(x.effectiveFrom)}: {usd(x.rateCents)} {RATE_TYPE_LABEL[x.rateType].toLowerCase()}{x.notes ? ` — ${x.notes}` : ""}</li>)}
                    </ul>
                  )}
                  <ActionForm action={setRateAction} submitLabel="Save rate" variant="secondary" className="mt-3 grid gap-2 sm:grid-cols-3">
                    <input type="hidden" name="instructorId" value={r.i.id} />
                    <Select name="rateType" aria-label="Rate basis">{Object.entries(RATE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
                    <Input name="rate" type="number" min={0} step="0.01" placeholder="USD" required aria-label="Rate (USD)" />
                    <Input name="effectiveFrom" type="date" defaultValue={today} required aria-label="Effective from" />
                    <Input name="notes" placeholder="Notes (optional)" className="sm:col-span-3" aria-label="Rate notes" />
                  </ActionForm>
                  <p className="mt-2 text-xs text-slate-500">Visible only to people who manage instructors or view billing. See the Instructor compensation report for amounts.</p>
                </details>
                <form action={instructorActiveAction} className="mt-3">
                  <input type="hidden" name="instructorId" value={r.i.id} /><input type="hidden" name="active" value={r.i.isActive ? "0" : "1"} />
                  <Button type="submit" variant="ghost">{r.i.isActive ? "Deactivate" : "Reactivate"}</Button>
                </form>
              </Card>
            );
          })}
        </div>
        <Card title="Add an instructor">
          <ActionForm action={addInstructorAction} submitLabel="Add instructor" resetOnSuccess className="space-y-3">
            <Field label="Member" name="userId" htmlFor="ai-user"><Select id="ai-user" name="userId" required>{d.members.filter((m) => !existing.has(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
            <Field label="Title" name="title" htmlFor="ai-title"><Input id="ai-title" name="title" placeholder="e.g. Clinical Educator, RN" maxLength={120} /></Field>
          </ActionForm>
          <p className="mt-3 text-xs text-slate-500">To let an instructor grade examinations, also give them the Instructor role under Administration → Users.</p>
        </Card>
      </div>
    </>
  );
}
