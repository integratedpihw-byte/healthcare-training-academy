/**
 * Instructor management (spec §17): profiles, qualifications and credentials, course
 * assignments, class scheduling, rosters, attendance, course evaluations, instructor
 * messages and performance. RLS limits writes (instructors.manage /
 * training.schedule.manage / the session's own instructor); triggers guard capacity,
 * cancelled sessions and attendance timing.
 */
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { announcements, attendance, courseReviews, courses, facilities, instructorCourses, instructors, memberships, trainingSessions, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import { can, type Access } from "@/lib/rbac/access";
import type { ServiceResult } from "@/lib/tenancy/service";
import { zonedToUtc } from "@/lib/time";
import { dbErrorMessage } from "@/lib/forms";

export interface Ctx {
  tenantId: string;
  userId: string;
  access: Access;
}
const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });
const optText = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export interface Credential {
  name: string;
  issuer: string;
  number?: string;
  expiresOn?: string;
}

/** "Name | Issuer | Number | YYYY-MM-DD" per line. */
export function parseCredentials(text: string): Credential[] | null {
  const out: Credential[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [name, issuer, number, expiresOn] = line.split("|").map((x) => x.trim());
    if (!name || !issuer) return null;
    if (expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) return null;
    out.push({ name, issuer, ...(number ? { number } : {}), ...(expiresOn ? { expiresOn } : {}) });
  }
  return out.slice(0, 30);
}

export const profileSchema = z.object({
  title: optText(120),
  bio: optText(2000),
  qualifications: z.string().max(2000).default("").transform((s) => s.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30)),
  credentials: z.string().max(5000).default(""),
});

export async function saveProfile(tx: Tx, ctx: Ctx, raw: unknown, instructorId?: string): Promise<ServiceResult<{ id: string }>> {
  const p = profileSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const creds = parseCredentials(p.data.credentials);
  if (!creds) return err("Credentials: one per line as “Name | Issuer | Number | YYYY-MM-DD” (number and date optional).", { credentials: ["Invalid format"] });
  const values = { title: p.data.title, bio: p.data.bio, qualifications: p.data.qualifications, credentials: creds };
  const [row] = instructorId
    ? await tx.select().from(instructors).where(eq(instructors.id, instructorId))
    : await tx.select().from(instructors).where(and(eq(instructors.userId, ctx.userId), eq(instructors.tenantId, ctx.tenantId)));
  if (!row) return err("Instructor profile not found.");
  if (row.userId !== ctx.userId && !can(ctx.access, "instructors.manage")) return err("You can only edit your own profile.");
  const r = await tx.update(instructors).set(values).where(eq(instructors.id, row.id)).returning({ id: instructors.id });
  if (!r.length) return err("You are not authorized to edit this profile.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.profile_updated", entityType: "instructor", entityId: row.id, after: { title: values.title, qualifications: values.qualifications.length, credentials: creds.length } });
  return { ok: true, data: { id: row.id } };
}

export async function addInstructor(tx: Tx, ctx: Ctx, userId: string, title: string | null): Promise<ServiceResult<{ id: string }>> {
  const [m] = await tx.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")));
  if (!m) return err("Choose an active member of your organization.");
  try {
    const [row] = await tx.insert(instructors).values({ tenantId: ctx.tenantId, userId, title }).onConflictDoNothing().returning({ id: instructors.id });
    if (!row) return err("That member already has an instructor profile.");
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.added", entityType: "instructor", entityId: row.id, after: { userId } });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to manage instructors.");
  }
}

export async function setInstructorActive(tx: Tx, ctx: Ctx, id: string, isActive: boolean): Promise<ServiceResult<null>> {
  if (!can(ctx.access, "instructors.manage")) return err("You are not authorized to manage instructors.");
  const r = await tx.update(instructors).set({ isActive }).where(and(eq(instructors.id, id), eq(instructors.tenantId, ctx.tenantId))).returning({ id: instructors.id });
  if (!r.length) return err("Instructor not found.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: isActive ? "instructor.activated" : "instructor.deactivated", entityType: "instructor", entityId: id });
  return { ok: true, data: null };
}

export async function assignCourse(tx: Tx, ctx: Ctx, instructorId: string, courseId: string): Promise<ServiceResult<null>> {
  const [c] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId));
  if (!c) return err("Course not found.");
  try {
    const r = await tx.insert(instructorCourses).values({ tenantId: ctx.tenantId, instructorId, courseId, assignedById: ctx.userId }).onConflictDoNothing().returning({ id: instructorCourses.id });
    if (!r.length) return err("Already assigned.");
  } catch {
    return err("You are not authorized to assign courses to instructors.");
  }
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.course_assigned", entityType: "instructor", entityId: instructorId, after: { courseId } });
  return { ok: true, data: null };
}

export async function unassignCourse(tx: Tx, ctx: Ctx, instructorId: string, courseId: string): Promise<ServiceResult<null>> {
  const r = await tx.delete(instructorCourses).where(and(eq(instructorCourses.instructorId, instructorId), eq(instructorCourses.courseId, courseId))).returning({ id: instructorCourses.id });
  if (!r.length) return err("Not assigned, or not authorized.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.course_unassigned", entityType: "instructor", entityId: instructorId, before: { courseId } });
  return { ok: true, data: null };
}

export async function listInstructors(tx: Tx) {
  const rows = await tx
    .select({ i: instructors, first: users.firstName, last: users.lastName, email: users.email })
    .from(instructors)
    .innerJoin(users, eq(users.id, instructors.userId))
    .orderBy(asc(users.lastName));
  const assigned = await tx.select({ instructorId: instructorCourses.instructorId, courseId: courses.id, title: courses.title }).from(instructorCourses).innerJoin(courses, eq(courses.id, instructorCourses.courseId));
  return rows.map((r) => ({ ...r, courses: assigned.filter((a) => a.instructorId === r.i.id) }));
}

export async function myInstructor(tx: Tx, ctx: { tenantId: string; userId: string }) {
  const [r] = await tx.select().from(instructors).where(and(eq(instructors.userId, ctx.userId), eq(instructors.tenantId, ctx.tenantId)));
  return r ?? null;
}

// ---------------------------------------------------------------------------
// Classes and attendance
// ---------------------------------------------------------------------------

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a date and time");
export const sessionSchema = z
  .object({
    title: z.string().trim().min(3, "Required").max(200),
    courseId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
    instructorId: z.string().uuid("Choose an instructor"),
    facilityId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
    delivery: z.enum(["IN_PERSON", "LIVE_VIRTUAL"]),
    location: optText(300),
    meetingUrl: z.string().trim().url("Enter a valid https:// link").refine((u) => u.startsWith("https://"), "Use an https:// link").optional().or(z.literal("")).transform((v) => v || null),
    startsAt: localDateTime,
    endsAt: localDateTime,
    capacity: z.union([z.literal(""), z.coerce.number().int().min(1).max(1000)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    description: optText(2000),
    timeZone: z.string().default("America/New_York"),
  })
  .superRefine((v, c) => {
    if (v.endsAt <= v.startsAt) c.addIssue({ code: "custom", path: ["endsAt"], message: "Must be after the start" });
    if (v.delivery === "LIVE_VIRTUAL" && !v.meetingUrl) c.addIssue({ code: "custom", path: ["meetingUrl"], message: "Required for live virtual classes" });
    if (v.delivery === "IN_PERSON" && !v.location) c.addIssue({ code: "custom", path: ["location"], message: "Required for in-person classes" });
  });

export async function createSession(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const p = sessionSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  const startsAt = zonedToUtc(v.startsAt, v.timeZone);
  const endsAt = zonedToUtc(v.endsAt, v.timeZone);
  if (startsAt.getTime() < Date.now() - 60_000) return err("The class cannot start in the past.");
  const [ins] = await tx.select({ id: instructors.id, active: instructors.isActive }).from(instructors).where(eq(instructors.id, v.instructorId));
  if (!ins || !ins.active) return err("Choose an active instructor.");
  if (v.facilityId) {
    const [f] = await tx.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, v.facilityId));
    if (!f) return err("Facility not found.");
  }
  try {
    const [row] = await tx
      .insert(trainingSessions)
      .values({ tenantId: ctx.tenantId, title: v.title, courseId: v.courseId, instructorId: v.instructorId, facilityId: v.facilityId, delivery: v.delivery, location: v.location, meetingUrl: v.meetingUrl, startsAt, endsAt, capacity: v.capacity, description: v.description, createdById: ctx.userId })
      .returning({ id: trainingSessions.id });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "session.scheduled", entityType: "training_session", entityId: row.id, after: { title: v.title, startsAt, instructorId: v.instructorId } });
    return { ok: true, data: { id: row.id } };
  } catch {
    return err("You are not authorized to schedule classes.");
  }
}

async function sessionOr404(tx: Tx, id: string) {
  const [s] = await tx.select().from(trainingSessions).where(eq(trainingSessions.id, id));
  return s ?? null;
}
const fmtWhen = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }) + " ET";

export async function registerAttendees(tx: Tx, ctx: Ctx, sessionId: string, userIds: string[]): Promise<ServiceResult<{ added: number; skipped: number }>> {
  const s = await sessionOr404(tx, sessionId);
  if (!s) return err("Class not found.");
  if (s.status !== "SCHEDULED") return err("Only scheduled classes accept registrations.");
  let added = 0;
  let skipped = 0;
  for (const u of [...new Set(userIds)]) {
    try {
      // Savepoint per attendee so a refusal keeps earlier registrations in this batch.
      const r = await tx.transaction((sp) => sp.insert(attendance).values({ tenantId: ctx.tenantId, sessionId, userId: u, recordedById: ctx.userId }).onConflictDoNothing().returning({ id: attendance.id }));
      if (!r.length) {
        skipped++;
        continue;
      }
      added++;
      await notify(tx, { tenantId: ctx.tenantId, userId: u, type: "assignment.class", title: `You are registered for a class: ${s.title}`, body: `${fmtWhen(s.startsAt)} · ${s.delivery === "LIVE_VIRTUAL" ? "live online" : s.location ?? "in person"}.`, link: "/learning", dedupeKey: `class:${sessionId}:${u}` });
    } catch (e) {
      const m = dbErrorMessage(e);
      if (/full/.test(m)) {
        if (added) await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "session.attendees_registered", entityType: "training_session", entityId: sessionId, after: { added, skipped } });
        return err(`The class is full (${added} registered before reaching capacity).`);
      }
      return err(/not a member/.test(m) ? "Attendees must be active members of your organization." : /cancelled/.test(m) ? "The class was cancelled." : /security/.test(m) ? "You are not authorized to register attendees for this class." : "Could not register an attendee.");
    }
  }
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "session.attendees_registered", entityType: "training_session", entityId: sessionId, after: { added, skipped } });
  return { ok: true, data: { added, skipped } };
}

export async function selfRegister(tx: Tx, ctx: { tenantId: string; userId: string }, sessionId: string): Promise<ServiceResult<null>> {
  const s = await sessionOr404(tx, sessionId);
  if (!s || s.status !== "SCHEDULED" || s.startsAt < new Date()) return err("This class is not open for registration.");
  try {
    await tx.insert(attendance).values({ tenantId: ctx.tenantId, sessionId, userId: ctx.userId }).onConflictDoNothing();
  } catch (e) {
    return err(/full/.test(dbErrorMessage(e)) ? "This class is full." : "Could not register.");
  }
  return { ok: true, data: null };
}

export async function recordAttendance(tx: Tx, ctx: Ctx, sessionId: string, marks: Record<string, "PRESENT" | "ABSENT" | "EXCUSED">): Promise<ServiceResult<{ recorded: number }>> {
  const s = await sessionOr404(tx, sessionId);
  if (!s) return err("Class not found.");
  if (s.startsAt > new Date()) return err("Attendance can be recorded once the class has started.");
  let recorded = 0;
  for (const [userId, status] of Object.entries(marks)) {
    try {
      const r = await tx.update(attendance).set({ status, recordedById: ctx.userId }).where(and(eq(attendance.sessionId, sessionId), eq(attendance.userId, userId))).returning({ id: attendance.id });
      recorded += r.length;
    } catch {
      return err("You are not authorized to record attendance for this class.");
    }
  }
  if (!recorded) return err("You are not authorized to record attendance for this class.");
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "session.attendance_recorded", entityType: "training_session", entityId: sessionId, after: marks });
  return { ok: true, data: { recorded } };
}

export async function setSessionStatus(tx: Tx, ctx: Ctx, sessionId: string, status: "COMPLETED" | "CANCELLED", reason?: string): Promise<ServiceResult<null>> {
  const s = await sessionOr404(tx, sessionId);
  if (!s) return err("Class not found.");
  if (s.status !== "SCHEDULED") return err("The class is already closed.");
  if (status === "CANCELLED" && (reason ?? "").trim().length < 5) return err("Give a reason for cancelling.");
  if (status === "COMPLETED" && s.startsAt > new Date()) return err("A class can be completed only after it starts.");
  const r = await tx.update(trainingSessions).set({ status, cancelledReason: status === "CANCELLED" ? reason!.trim() : null }).where(eq(trainingSessions.id, sessionId)).returning({ id: trainingSessions.id });
  if (!r.length) return err("You are not authorized to change this class.");
  if (status === "CANCELLED") {
    const roster = await tx.select({ userId: attendance.userId }).from(attendance).where(eq(attendance.sessionId, sessionId));
    await notify(tx, roster.map((a) => ({ tenantId: ctx.tenantId, userId: a.userId, type: "class.cancelled", title: `Class cancelled: ${s.title}`, body: `The class on ${fmtWhen(s.startsAt)} was cancelled. Reason: ${reason!.trim()}`, link: "/learning", dedupeKey: `class-cancel:${sessionId}:${a.userId}` })));
  }
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: status === "CANCELLED" ? "session.cancelled" : "session.completed", entityType: "training_session", entityId: sessionId, after: { reason: reason ?? null } });
  return { ok: true, data: null };
}

export async function listSessions(tx: Tx, opts: { upcomingOnly?: boolean; instructorUserId?: string } = {}) {
  return tx
    .select({
      s: trainingSessions,
      courseTitle: courses.title,
      facilityName: facilities.name,
      instructorName: sql<string | null>`(select u.first_name || ' ' || u.last_name from instructors i join users u on u.id = i.user_id where i.id = ${trainingSessions.instructorId})`,
      registered: sql<number>`app_session_seats_taken(${trainingSessions.id})`,
    })
    .from(trainingSessions)
    .leftJoin(courses, eq(courses.id, trainingSessions.courseId))
    .leftJoin(facilities, eq(facilities.id, trainingSessions.facilityId))
    .where(
      and(
        opts.upcomingOnly ? gte(trainingSessions.endsAt, new Date()) : undefined,
        opts.instructorUserId ? sql`exists (select 1 from instructors i where i.id = ${trainingSessions.instructorId} and i.user_id = ${opts.instructorUserId}::uuid)` : undefined,
      ),
    )
    .orderBy(opts.upcomingOnly ? asc(trainingSessions.startsAt) : desc(trainingSessions.startsAt))
    .limit(300);
}

export async function getSession(tx: Tx, id: string) {
  const [row] = await tx
    .select({ s: trainingSessions, courseTitle: courses.title, facilityName: facilities.name, instructorUserId: instructors.userId, instructorName: sql<string | null>`(select u.first_name || ' ' || u.last_name from users u where u.id = ${instructors.userId})` })
    .from(trainingSessions)
    .leftJoin(courses, eq(courses.id, trainingSessions.courseId))
    .leftJoin(facilities, eq(facilities.id, trainingSessions.facilityId))
    .leftJoin(instructors, eq(instructors.id, trainingSessions.instructorId))
    .where(eq(trainingSessions.id, id));
  if (!row) return null;
  const roster = await tx
    .select({ a: attendance, first: users.firstName, last: users.lastName, email: users.email })
    .from(attendance)
    .innerJoin(users, eq(users.id, attendance.userId))
    .where(eq(attendance.sessionId, id))
    .orderBy(asc(users.lastName));
  return { ...row, roster };
}

export async function mySessions(tx: Tx, userId: string) {
  return tx
    .select({ s: trainingSessions, status: attendance.status, courseTitle: courses.title })
    .from(attendance)
    .innerJoin(trainingSessions, eq(trainingSessions.id, attendance.sessionId))
    .leftJoin(courses, eq(courses.id, trainingSessions.courseId))
    .where(and(eq(attendance.userId, userId), gte(trainingSessions.endsAt, new Date(Date.now() - 30 * 86_400_000))))
    .orderBy(asc(trainingSessions.startsAt));
}

/** Upcoming scheduled classes with seats, for courses the learner is enrolled in or assigned. */
export async function openSessionsFor(tx: Tx, userId: string) {
  return tx
    .select({ s: trainingSessions, courseTitle: courses.title, registered: sql<number>`app_session_seats_taken(${trainingSessions.id})` })
    .from(trainingSessions)
    .leftJoin(courses, eq(courses.id, trainingSessions.courseId))
    .where(
      and(
        eq(trainingSessions.status, "SCHEDULED"),
        gte(trainingSessions.startsAt, new Date()),
        sql`not exists (select 1 from attendance a where a.session_id = ${trainingSessions.id} and a.user_id = ${userId}::uuid)`,
        sql`(${trainingSessions.courseId} in (select course_id from enrollments where user_id = ${userId}::uuid)
             or ${trainingSessions.courseId} in (select ta.course_id from training_assignments ta join employees e on e.id = ta.employee_id where e.user_id = ${userId}::uuid and ta.status in ('ASSIGNED','IN_PROGRESS','OVERDUE')))`,
      ),
    )
    .orderBy(asc(trainingSessions.startsAt))
    .limit(20);
}

// ---------------------------------------------------------------------------
// Messages, evaluations and performance
// ---------------------------------------------------------------------------

export const messageSchema = z.object({
  sessionId: z.string().uuid().optional().or(z.literal("")),
  courseId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(2000),
});

/** Instructor messages (spec §18): to a class roster, or to learners enrolled in an assigned course. */
export async function sendInstructorMessage(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ recipients: number }>> {
  const p = messageSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  const me = await myInstructor(tx, ctx);
  const manager = can(ctx.access, "training.schedule.manage");
  let recipients: string[] = [];
  let audience: Record<string, string>;
  if (v.sessionId) {
    const s = await sessionOr404(tx, v.sessionId);
    if (!s) return err("Class not found.");
    if (!manager && (!me || s.instructorId !== me.id)) return err("You can message only your own classes.");
    recipients = (await tx.select({ u: attendance.userId }).from(attendance).where(eq(attendance.sessionId, v.sessionId))).map((r) => r.u);
    audience = { kind: "session", sessionId: v.sessionId };
  } else if (v.courseId) {
    if (!manager) {
      if (!me) return err("Only instructors can send course messages.");
      const [a] = await tx.select({ id: instructorCourses.id }).from(instructorCourses).where(and(eq(instructorCourses.instructorId, me.id), eq(instructorCourses.courseId, v.courseId)));
      if (!a) return err("You can message only learners in courses assigned to you.");
    }
    recipients = (await tx.execute<{ user_id: string }>(sql`select distinct user_id from enrollments where course_id = ${v.courseId}::uuid and status in ('NOT_STARTED','IN_PROGRESS','AWAITING_ASSESSMENT','FAILED')`)).rows.map((r) => r.user_id);
    audience = { kind: "course", courseId: v.courseId };
  } else return err("Choose a class or a course.");
  recipients = recipients.filter((u) => u !== ctx.userId);
  if (!recipients.length) return err("There is nobody to message yet.");
  try {
    const [row] = await tx.insert(announcements).values({ tenantId: ctx.tenantId, authorId: ctx.userId, title: v.title, body: v.body, audience, recipientCount: recipients.length }).returning({ id: announcements.id });
    await notify(tx, recipients.map((u) => ({ tenantId: ctx.tenantId, userId: u, type: "announcement.instructor", title: v.title, body: v.body, link: "/notifications", dedupeKey: `msg:${row.id}:${u}` })));
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.message_sent", entityType: "announcement", entityId: row.id, after: { audience, recipients: recipients.length } });
  } catch {
    return err("You are not authorized to send messages.");
  }
  return { ok: true, data: { recipients: recipients.length } };
}

export async function evaluationSummary(tx: Tx, courseIds?: string[]) {
  return tx
    .select({ courseId: courseReviews.courseId, title: courses.title, n: sql<number>`count(*)::int`, avg: sql<number>`round(avg(${courseReviews.rating})::numeric, 2)::float` })
    .from(courseReviews)
    .innerJoin(courses, eq(courses.id, courseReviews.courseId))
    .where(courseIds?.length ? inArray(courseReviews.courseId, courseIds) : undefined)
    .groupBy(courseReviews.courseId, courses.title)
    .orderBy(desc(sql`count(*)`));
}

export async function recentComments(tx: Tx, courseIds?: string[], limit = 20) {
  return tx
    .select({ title: courses.title, rating: courseReviews.rating, comment: courseReviews.comment, at: courseReviews.createdAt })
    .from(courseReviews)
    .innerJoin(courses, eq(courses.id, courseReviews.courseId))
    .where(and(sql`${courseReviews.comment} is not null`, courseIds?.length ? inArray(courseReviews.courseId, courseIds) : undefined))
    .orderBy(desc(courseReviews.createdAt))
    .limit(limit);
}

/** Instructor performance (spec §17): classes, attendance rate, ratings of assigned courses, grading, evaluations. */
export async function instructorPerformance(tx: Tx, from: string, to: string) {
  return (
    await tx.execute<{ id: string; name: string; classes: number; present: number; marked: number; rating: number | null; ratings: number; graded: number; evaluations: number }>(sql`
    select i.id, u.first_name || ' ' || u.last_name name,
           (select count(*)::int from training_sessions s where s.instructor_id = i.id and s.status = 'COMPLETED' and s.starts_at::date between ${from}::date and ${to}::date) classes,
           (select count(*)::int from attendance a join training_sessions s on s.id = a.session_id where s.instructor_id = i.id and a.status = 'PRESENT' and s.starts_at::date between ${from}::date and ${to}::date) present,
           (select count(*)::int from attendance a join training_sessions s on s.id = a.session_id where s.instructor_id = i.id and a.status in ('PRESENT','ABSENT') and s.starts_at::date between ${from}::date and ${to}::date) marked,
           (select round(avg(r.rating)::numeric, 2)::float from course_reviews r where r.course_id in (select course_id from instructor_courses ic where ic.instructor_id = i.id)) rating,
           (select count(*)::int from course_reviews r where r.course_id in (select course_id from instructor_courses ic where ic.instructor_id = i.id)) ratings,
           (select count(*)::int from examination_answers ea join examination_attempts at on at.id = ea.attempt_id where ea.graded_by_id = i.user_id and coalesce(at.graded_at, ea.saved_at)::date between ${from}::date and ${to}::date) graded,
           (select count(*)::int from competency_assessments ca where ca.evaluator_user_id = i.user_id and ca.status = 'SIGNED' and ca.signed_at::date between ${from}::date and ${to}::date) evaluations
      from instructors i join users u on u.id = i.user_id
     where i.tenant_id is not null
     order by 2`)
  ).rows;
}

export async function memberOptions(tx: Tx) {
  return tx
    .select({ id: users.id, name: sql<string>`${users.lastName} || ', ' || ${users.firstName}`, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.status, "ACTIVE"))
    .orderBy(asc(users.lastName));
}
