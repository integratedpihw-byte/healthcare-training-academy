import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireFeature, requireTenant } from "@/lib/auth/context";
import { getSession, memberOptions } from "@/lib/instructors/service";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { InstructorNav } from "../../nav";
import { attendanceAction, messageAction, registerAttendeesAction, sessionStatusAction } from "../../class-actions";

export const metadata = { title: "Class" };
const TONE = { REGISTERED: "blue", PRESENT: "green", ABSENT: "red", EXCUSED: "gray" } as const;

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireTenant();
  requireFeature(ctx, "instructorLed");
  const manage = ctx.can("training.schedule.manage");
  const d = await ctx.tx(async (tx) => {
    const s = await getSession(tx, id);
    return s ? { ...s, members: manage ? await memberOptions(tx) : [] } : null;
  });
  if (!d) notFound();
  const isInstructor = d.instructorUserId === ctx.user.id;
  if (!manage && !isInstructor) redirect("/forbidden?p=class");
  const s = d.s;
  const started = s.startsAt <= new Date();
  const open = s.status === "SCHEDULED";
  const onRoster = new Set(d.roster.map((r) => r.a.userId));
  const candidates = d.members.filter((m) => !onRoster.has(m.id));
  return (
    <>
      <PageHeader title={s.title} description={`${s.startsAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: ctx.tenant.timeZone })} – ${s.endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: ctx.tenant.timeZone, timeZoneName: "short" })}`} actions={<Link href="/instructor/classes" className="text-sm font-semibold text-teal-700 hover:underline">← Classes</Link>} />
      <InstructorNav ctx={ctx} active="classes" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {s.status === "CANCELLED" && <Alert tone="amber">This class was cancelled. Reason: {s.cancelledReason}</Alert>}
          <Card title={`Roster (${d.roster.length}${s.capacity ? ` of ${s.capacity}` : ""})`}>
            {d.roster.length === 0 ? <EmptyState>Nobody is registered yet.</EmptyState> : (
              <ActionForm action={attendanceAction} submitLabel="Save attendance" className="space-y-3">
                <input type="hidden" name="sessionId" value={s.id} />
                <Table head={["Attendee", "Status", started && s.status !== "CANCELLED" ? "Record" : ""]}>
                  {d.roster.map((r) => (
                    <tr key={r.a.id}>
                      <Td>{r.last}, {r.first}<div className="text-xs text-slate-500">{r.email}</div></Td>
                      <Td><Badge tone={TONE[r.a.status]}>{r.a.status.toLowerCase()}</Badge></Td>
                      <Td>
                        {started && s.status !== "CANCELLED" ? (
                          <Select name={`mark:${r.a.userId}`} aria-label={`Attendance for ${r.first} ${r.last}`} defaultValue={r.a.status === "REGISTERED" ? "" : r.a.status}>
                            <option value="">—</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excused</option>
                          </Select>
                        ) : null}
                      </Td>
                    </tr>
                  ))}
                </Table>
                {!started && <p className="text-xs text-slate-500">Attendance can be recorded once the class starts.</p>}
              </ActionForm>
            )}
          </Card>
          {(manage || isInstructor) && d.roster.length > 0 && (
            <Card title="Message attendees">
              <ActionForm action={messageAction} submitLabel="Send message" resetOnSuccess className="space-y-3">
                <input type="hidden" name="sessionId" value={s.id} />
                <Field label="Subject" name="title" htmlFor="m-title"><Input id="m-title" name="title" required maxLength={120} /></Field>
                <Field label="Message" name="body" htmlFor="m-body" hint="Do not include patient information."><Textarea id="m-body" name="body" rows={3} required maxLength={2000} /></Field>
              </ActionForm>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-slate-500">Status</dt><dd><Badge tone={s.status === "COMPLETED" ? "green" : s.status === "CANCELLED" ? "gray" : "blue"}>{s.status.toLowerCase()}</Badge></dd></div>
              <div><dt className="text-xs text-slate-500">Instructor</dt><dd>{d.instructorName ?? "—"}</dd></div>
              {d.courseTitle && <div><dt className="text-xs text-slate-500">Course</dt><dd>{d.courseTitle}</dd></div>}
              <div><dt className="text-xs text-slate-500">Delivery</dt><dd>{s.delivery === "LIVE_VIRTUAL" ? "Live virtual" : "In person"}</dd></div>
              {s.location && <div><dt className="text-xs text-slate-500">Location</dt><dd>{d.facilityName ? `${d.facilityName} · ` : ""}{s.location}</dd></div>}
              {s.meetingUrl && <div><dt className="text-xs text-slate-500">Meeting link</dt><dd><a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" className="break-all text-teal-700 underline">{s.meetingUrl}</a></dd></div>}
              {s.description && <div><dt className="text-xs text-slate-500">Description</dt><dd className="whitespace-pre-line">{s.description}</dd></div>}
            </dl>
          </Card>
          {manage && open && (
            <Card title="Register attendees">
              {candidates.length === 0 ? <EmptyState>Every active member is already registered.</EmptyState> : (
                <ActionForm action={registerAttendeesAction} submitLabel="Register" className="space-y-3">
                  <input type="hidden" name="sessionId" value={s.id} />
                  <Field label="Members" name="userId" htmlFor="r-users" hint="Hold Ctrl/⌘ to choose several."><Select id="r-users" name="userId" multiple size={8}>{candidates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
                </ActionForm>
              )}
            </Card>
          )}
          {open && (manage || isInstructor) && (
            <Card title="Close the class">
              {started && (
                <ActionForm action={sessionStatusAction} submitLabel="Mark completed" variant="teal" className="mb-4">
                  <input type="hidden" name="sessionId" value={s.id} /><input type="hidden" name="status" value="COMPLETED" />
                </ActionForm>
              )}
              <ActionForm action={sessionStatusAction} submitLabel="Cancel class" variant="danger" confirm="Cancel this class and notify everyone registered?" className="space-y-2">
                <input type="hidden" name="sessionId" value={s.id} /><input type="hidden" name="status" value="CANCELLED" />
                <Field label="Reason" name="reason" htmlFor="c-reason"><Input id="c-reason" name="reason" required minLength={5} maxLength={300} /></Field>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
