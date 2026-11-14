import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireFeature, requireTenant } from "@/lib/auth/context";
import { courses, facilities, instructors, users } from "@/db/schema";
import { listSessions } from "@/lib/instructors/service";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { InstructorNav } from "../nav";
import { createSessionAction } from "../class-actions";

export const metadata = { title: "Classes" };

const when = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const STATUS_TONE = { SCHEDULED: "blue", COMPLETED: "green", CANCELLED: "gray" } as const;

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const ctx = await requireTenant();
  const manage = ctx.can("training.schedule.manage");
  if (!manage && !ctx.can("assessments.grade")) redirect("/forbidden?p=classes");
  requireFeature(ctx, "instructorLed");
  const { view } = await searchParams;
  const past = view === "past";
  const data = await ctx.tx(async (tx) => ({
    sessions: await listSessions(tx, { upcomingOnly: !past, instructorUserId: manage ? undefined : ctx.user.id }),
    instructors: manage ? await tx.select({ id: instructors.id, first: users.firstName, last: users.lastName }).from(instructors).innerJoin(users, eq(users.id, instructors.userId)).where(eq(instructors.isActive, true)).orderBy(asc(users.lastName)) : [],
    courses: manage ? await tx.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "PUBLISHED")).orderBy(asc(courses.title)) : [],
    facilities: manage ? await tx.select({ id: facilities.id, name: facilities.name }).from(facilities).orderBy(asc(facilities.name)) : [],
  }));
  const shown = past ? data.sessions.filter((s) => s.s.endsAt < new Date() || s.s.status !== "SCHEDULED") : data.sessions;
  return (
    <>
      <PageHeader title="Instructor Portal" description="Schedule instructor-led and live virtual classes, manage rosters and record attendance. Attending a class does not by itself establish clinical competency." />
      <InstructorNav ctx={ctx} active="classes" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title={past ? "Past classes" : "Upcoming classes"} actions={<Link className="text-sm font-semibold text-teal-700 hover:underline" href={past ? "/instructor/classes" : "/instructor/classes?view=past"}>{past ? "Show upcoming" : "Show past"}</Link>}>
          <Table head={["When (ET)", "Class", "Instructor", "Delivery", "Roster", "Status"]} empty={shown.length === 0 ? <EmptyState>{past ? "No past classes." : manage ? "No upcoming classes. Schedule one using the form." : "You have no upcoming classes."}</EmptyState> : undefined}>
            {shown.map(({ s, courseTitle, instructorName, facilityName, registered }) => (
              <tr key={s.id}>
                <Td className="whitespace-nowrap">{when(s.startsAt)}</Td>
                <Td><Link href={`/instructor/classes/${s.id}`} className="font-medium text-teal-700 hover:underline">{s.title}</Link>{courseTitle && <div className="text-xs text-slate-500">{courseTitle}</div>}</Td>
                <Td>{instructorName ?? "—"}</Td>
                <Td>{s.delivery === "LIVE_VIRTUAL" ? "Live virtual" : `In person${facilityName ? ` · ${facilityName}` : ""}`}</Td>
                <Td>{registered}{s.capacity ? ` / ${s.capacity}` : ""}</Td>
                <Td><Badge tone={STATUS_TONE[s.status]}>{s.status.toLowerCase()}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
        {manage && (
          <Card title="Schedule a class">
            {data.instructors.length === 0 ? <EmptyState>Add an active instructor first under <Link className="underline" href="/instructor/instructors">Instructors</Link>.</EmptyState> : (
              <ActionForm action={createSessionAction} submitLabel="Schedule class" className="space-y-3">
                <input type="hidden" name="timeZone" value="America/New_York" />
                <Field label="Title" name="title" htmlFor="s-title"><Input id="s-title" name="title" required maxLength={200} /></Field>
                <Field label="Course (optional)" name="courseId" htmlFor="s-course"><Select id="s-course" name="courseId" defaultValue=""><option value="">— Not linked to a course —</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
                <Field label="Instructor" name="instructorId" htmlFor="s-ins"><Select id="s-ins" name="instructorId" required>{data.instructors.map((i) => <option key={i.id} value={i.id}>{i.last}, {i.first}</option>)}</Select></Field>
                <Field label="Delivery" name="delivery" htmlFor="s-del"><Select id="s-del" name="delivery"><option value="IN_PERSON">In person</option><option value="LIVE_VIRTUAL">Live virtual</option></Select></Field>
                <Field label="Facility (in person)" name="facilityId" htmlFor="s-fac"><Select id="s-fac" name="facilityId" defaultValue=""><option value="">—</option>{data.facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></Field>
                <Field label="Location / room" name="location" htmlFor="s-loc" hint="Required for in-person classes"><Input id="s-loc" name="location" maxLength={300} /></Field>
                <Field label="Meeting link" name="meetingUrl" htmlFor="s-url" hint="Required for live virtual classes (https://)"><Input id="s-url" name="meetingUrl" type="url" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Starts (ET)" name="startsAt" htmlFor="s-start"><Input id="s-start" name="startsAt" type="datetime-local" required /></Field>
                  <Field label="Ends (ET)" name="endsAt" htmlFor="s-end"><Input id="s-end" name="endsAt" type="datetime-local" required /></Field>
                </div>
                <Field label="Capacity" name="capacity" htmlFor="s-cap" hint="Leave blank for no limit"><Input id="s-cap" name="capacity" type="number" min={1} max={1000} /></Field>
                <Field label="Description" name="description" htmlFor="s-desc"><Textarea id="s-desc" name="description" rows={3} maxLength={2000} /></Field>
              </ActionForm>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
