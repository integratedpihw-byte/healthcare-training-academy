/**
 * DEMO Phase 6 data for Sunshine Care Group (DEMO): an instructor profile with
 * clearly-labeled demo credentials, course assignments, one completed past class with
 * attendance, one upcoming class with registrations, and a course evaluation.
 * Idempotent: skipped when the tenant already has an instructor profile.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { withTenant } from "../client";
import { attendance, courses, enrollments, facilities, instructorCourses, instructors, tenants, trainingSessions, users } from "../schema";
import { submitCourseReview } from "@/lib/learning/learner";

export async function seedDemoEnterprise(sys: Db): Promise<string[]> {
  const done: string[] = [];
  const [t] = await sys.select().from(tenants).where(eq(tenants.slug, "demo-sunshine"));
  if (!t) return done;
  const [already] = await sys.select({ id: instructors.id }).from(instructors).where(eq(instructors.tenantId, t.id)).limit(1);
  if (already) return done;
  const byEmail = async (e: string) => (await sys.select().from(users).where(eq(users.email, e)))[0];
  const [daniel, director, grace, jordan] = await Promise.all(["instructor@sunshine.example", "director@sunshine.example", "supervisor@sunshine.example", "learner@sunshine.example"].map(byEmail));
  const [hipaa] = await sys.select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHITA-MC-001")));
  const [bbp] = await sys.select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHITA-MC-004")));
  const [alf] = await sys.select().from(facilities).where(and(eq(facilities.tenantId, t.id), eq(facilities.facilityType, "ASSISTED_LIVING_FACILITY")));
  if (!daniel || !director || !grace || !jordan || !hipaa) return done;

  const [ins] = await sys
    .insert(instructors)
    .values({
      tenantId: t.id,
      userId: daniel.id,
      title: "Clinical Educator (DEMO)",
      bio: "DEMO profile. Fictional clinical educator used to demonstrate instructor management.",
      qualifications: ["DEMO — BSN, 10 years long-term care", "DEMO — Infection prevention lead"],
      credentials: [
        { name: "Registered Nurse (DEMO — not a real license)", issuer: "Florida Board of Nursing", number: "DEMO-RN-0000", expiresOn: "2027-07-31" },
        { name: "BLS Instructor (DEMO)", issuer: "DEMO training center", expiresOn: "2027-03-31" },
      ],
    })
    .returning({ id: instructors.id });
  for (const c of [hipaa, bbp].filter(Boolean)) await sys.insert(instructorCourses).values({ tenantId: t.id, instructorId: ins.id, courseId: c!.id, assignedById: director.id });
  done.push("Instructor profile for Daniel Ortiz with DEMO credentials and two assigned courses");

  const day = 86_400_000;
  const at = (offsetDays: number, hourUtc: number) => { const d = new Date(Date.now() + offsetDays * day); d.setUTCHours(hourUtc, 0, 0, 0); return d; };
  const [past] = await sys
    .insert(trainingSessions)
    .values({ tenantId: t.id, title: "HIPAA in Practice — classroom review (DEMO)", courseId: hipaa.id, instructorId: ins.id, facilityId: alf?.id ?? null, delivery: "IN_PERSON", location: "Training Room A (DEMO)", startsAt: at(-14, 14), endsAt: at(-14, 16), capacity: 12, status: "COMPLETED", createdById: director.id })
    .returning({ id: trainingSessions.id });
  await sys.insert(attendance).values([
    { tenantId: t.id, sessionId: past.id, userId: grace.id, status: "PRESENT", recordedById: daniel.id },
    { tenantId: t.id, sessionId: past.id, userId: jordan.id, status: "ABSENT", recordedById: daniel.id },
  ]);
  const [next] = await sys
    .insert(trainingSessions)
    .values({ tenantId: t.id, title: "Bloodborne Pathogens — live Q&A (DEMO)", courseId: (bbp ?? hipaa).id, instructorId: ins.id, delivery: "LIVE_VIRTUAL", meetingUrl: "https://meet.example.com/demo-bbp", startsAt: at(10, 18), endsAt: at(10, 19), capacity: 20, createdById: director.id })
    .returning({ id: trainingSessions.id });
  await sys.insert(attendance).values({ tenantId: t.id, sessionId: next.id, userId: grace.id });
  done.push("Two classes: a completed in-person class with attendance and an upcoming live virtual class");

  const [graceHipaa] = await sys.select().from(enrollments).where(and(eq(enrollments.userId, grace.id), eq(enrollments.courseId, hipaa.id), eq(enrollments.status, "COMPLETED")));
  if (graceHipaa) {
    await withTenant({ tenantId: t.id, userId: grace.id }, async (tx) => {
      await submitCourseReview(tx, { tenantId: t.id, userId: grace.id }, hipaa.id, { rating: 5, comment: "DEMO evaluation: clear scenarios and practical examples." });
    });
    done.push("A course evaluation (DEMO) for HIPAA Privacy");
  }
  return done;
}
