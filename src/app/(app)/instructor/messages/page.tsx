import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { announcements, courses, instructorCourses } from "@/db/schema";
import { myInstructor } from "@/lib/instructors/service";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { InstructorNav } from "../nav";
import { messageAction } from "../class-actions";

export const metadata = { title: "Instructor messages" };

export default async function MessagesPage() {
  const ctx = await requireTenant();
  const manager = ctx.can("training.schedule.manage");
  if (!manager && !ctx.can("assessments.grade")) redirect("/forbidden?p=messages");
  const d = await ctx.tx(async (tx) => {
    const me = await myInstructor(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id });
    const list = manager
      ? await tx.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "PUBLISHED")).orderBy(asc(courses.title))
      : me
        ? await tx.select({ id: courses.id, title: courses.title }).from(instructorCourses).innerJoin(courses, eq(courses.id, instructorCourses.courseId)).where(eq(instructorCourses.instructorId, me.id)).orderBy(asc(courses.title))
        : [];
    const sent = await tx.select().from(announcements).where(and(eq(announcements.authorId, ctx.user.id), sql`${announcements.audience}->>'kind' in ('course','session')`)).orderBy(desc(announcements.createdAt)).limit(20);
    return { list, sent };
  });
  return (
    <>
      <PageHeader title="Instructor Portal" description="Message learners enrolled in your courses. To message a class roster, open the class." />
      <InstructorNav ctx={ctx} active="messages" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="New course message">
          {d.list.length === 0 ? <EmptyState>No courses are assigned to you yet.</EmptyState> : (
            <ActionForm action={messageAction} submitLabel="Send" resetOnSuccess className="space-y-3">
              <Field label="Course" name="courseId" htmlFor="cm-course" hint="Sent to learners with an open enrollment."><Select id="cm-course" name="courseId" required>{d.list.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
              <Field label="Subject" name="title" htmlFor="cm-title"><Input id="cm-title" name="title" required maxLength={120} /></Field>
              <Field label="Message" name="body" htmlFor="cm-body" hint="Do not include patient information."><Textarea id="cm-body" name="body" rows={4} required maxLength={2000} /></Field>
            </ActionForm>
          )}
        </Card>
        <Card title="Sent">
          <Table head={["Date", "Subject", "Recipients"]} empty={d.sent.length === 0 ? <EmptyState>No messages sent.</EmptyState> : undefined}>
            {d.sent.map((a) => <tr key={a.id}><Td>{fmtDate(a.createdAt)}</Td><Td>{a.title}</Td><Td>{a.recipientCount}</Td></tr>)}
          </Table>
        </Card>
      </div>
    </>
  );
}
