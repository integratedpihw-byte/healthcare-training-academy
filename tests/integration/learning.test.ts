import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, isNull, sql } from "drizzle-orm";
import { closePools, systemDb, withTenant, type Tx } from "@/db/client";
import { courseCategories, courseVersions, courses, enrollments, examinations, lessonProgress, lessons, modules, questionBanks, users } from "@/db/schema";
import { seedLibrary } from "@/db/seed/library";
import {
  addLesson,
  addModule,
  createCourse,
  createNewVersion,
  decide,
  getBuilderCourse,
  moveLesson,
  placeLesson,
  placeModule,
  setObjectives,
  submitForReview,
  type AuthorScope,
} from "@/lib/learning/builder";
import { enroll, getPlayer, listCatalog, recordProgress, submitKnowledgeCheck, toggleBookmark } from "@/lib/learning/learner";
import { can, loadAccess } from "@/lib/rbac/access";
import { applyExamOutcome, getAttempt, startAttempt, submitAttempt } from "@/lib/assessment/engine";
import { addMember, createTenant, expectPgError, platformAdmin, type TenantFixture } from "../support/fixtures";
import { LIBRARY } from "@/content";

let A: TenantFixture;
let B: TenantFixture;
let learnerA: { userId: string };
let learner2A: { userId: string };
let hipaaId: string;

const platformScope = async (): Promise<AuthorScope> => ({ db: systemDb(), tenantId: null, userId: (await platformAdmin()).id, can: () => true });
const as = (t: TenantFixture, userId: string) => <R>(fn: (tx: Tx) => Promise<R>) => withTenant({ tenantId: t.tenantId, userId }, fn);
async function tenantScope<R>(t: TenantFixture, userId: string, fn: (s: AuthorScope) => Promise<R>) {
  return withTenant({ tenantId: t.tenantId, userId }, async (tx) => {
    const access = await loadAccess(tx, t.tenantId, userId);
    return fn({ db: tx, tenantId: t.tenantId, userId, can: (p) => can(access, p) });
  });
}

/** Moves a version through the approval chain as the platform administrator. */
async function approveAll(scope: AuthorScope, courseId: string) {
  for (let i = 0; i < 4; i++) {
    const b = await getBuilderCourse(scope, courseId);
    if (!b?.nextStage) break;
    const r = await decide(scope, courseId, { decision: "APPROVED", comments: "test", reviewerCredentials: b.nextStage === "CLINICAL_APPROVAL" ? "RN, FL RN0000000 (test)" : "" });
    if (!r.ok) throw new Error(r.error);
  }
}

beforeAll(async () => {
  A = await createTenant("learnA");
  B = await createTenant("learnB");
  learnerA = await addMember(A, "learner");
  learner2A = await addMember(A, "learner");
  const lib = await seedLibrary(systemDb());
  expect(lib.created.length + lib.skipped.length).toBe(LIBRARY.length);
  const [c] = await systemDb().select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHITA-MC-001")));
  hipaaId = c.id;
});
afterAll(() => closePools());

describe("library content", () => {
  it("every library course meets the content minimums (objectives, ≥5 sections, knowledge checks, 15+ exam questions, references)", () => {
    for (const c of LIBRARY) {
      expect(c.objectives.length).toBeGreaterThanOrEqual(4);
      expect(c.modules.length).toBeGreaterThanOrEqual(5);
      expect(c.modules.flatMap((m) => m.lessons).some((l) => l.type === "KNOWLEDGE_CHECK")).toBe(true);
      expect(c.finalExam.questions.length).toBeGreaterThanOrEqual(15);
      expect(c.sourceReferences.length).toBeGreaterThan(0);
      for (const q of c.finalExam.questions) {
        const ids = q.options.map((o) => o.id);
        for (const k of Array.isArray(q.correct) ? q.correct : [q.correct]) expect(ids).toContain(k);
      }
      for (const l of c.modules.flatMap((m) => m.lessons)) {
        for (const q of l.mediaMeta?.questions ?? []) {
          const ids = q.options.map((o) => o.id);
          for (const k of Array.isArray(q.correct) ? q.correct : [q.correct]) expect(ids).toContain(k);
        }
      }
    }
  });

  it("seeds library courses as IN_REVIEW with question banks; they are hidden from the catalog until approved", async () => {
    const [v] = await systemDb().select().from(courseVersions).where(eq(courseVersions.courseId, hipaaId));
    expect(v.status).toBe("IN_REVIEW");
    const banks = await systemDb().select().from(questionBanks).where(eq(questionBanks.courseId, hipaaId));
    expect(banks).toHaveLength(1);
    const cat = await as(A, learnerA.userId)((tx) => listCatalog(tx, learnerA.userId));
    expect(cat.find((c) => c.id === hipaaId)).toBeUndefined();
  });

  it("the database refuses to publish without the recorded approval chain", async () => {
    const [v] = await systemDb().select().from(courseVersions).where(eq(courseVersions.courseId, hipaaId));
    const e = await expectPgError(systemDb().update(courseVersions).set({ status: "PUBLISHED" }).where(eq(courseVersions.id, v.id)));
    expect(e.message).toMatch(/missing REVIEW approval/);
  });

  it("clinical approval requires credentials; full chain publishes and the course appears for every tenant", async () => {
    const scope = await platformScope();
    const bpp = (await systemDb().select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHITA-MC-004"))))[0];
    expect((await decide(scope, bpp.id, { decision: "APPROVED", comments: "ok" })).ok).toBe(true); // review
    const noCreds = await decide(scope, bpp.id, { decision: "APPROVED", comments: "ok" });
    expect(noCreds.ok).toBe(false); // clinical needs credentials
    await approveAll(scope, bpp.id);
    await approveAll(scope, hipaaId);
    const forA = await as(A, learnerA.userId)((tx) => listCatalog(tx, learnerA.userId));
    const forB = await as(B, B.adminUserId)((tx) => listCatalog(tx, B.adminUserId));
    expect(forA.map((c) => c.code)).toEqual(expect.arrayContaining(["CHITA-MC-001", "CHITA-MC-004"]));
    expect(forB.map((c) => c.code)).toEqual(expect.arrayContaining(["CHITA-MC-001", "CHITA-MC-004"]));
  });

  it("published content is frozen — lessons cannot be edited in place", async () => {
    const [c] = await systemDb().select().from(courses).where(eq(courses.id, hipaaId));
    const [l] = await systemDb().select({ id: lessons.id }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(eq(modules.courseVersionId, c.currentVersionId!)).limit(1);
    const e = await expectPgError(systemDb().update(lessons).set({ title: "edited" }).where(eq(lessons.id, l.id)));
    expect(e.message).toMatch(/frozen/);
  });
});

describe("enrollment and progress", () => {
  let enrollmentId: string;

  it("enrolls once (idempotent) and pins the published version", async () => {
    const r1 = await as(A, learnerA.userId)((tx) => enroll(tx, { tenantId: A.tenantId, userId: learnerA.userId }, hipaaId));
    const r2 = await as(A, learnerA.userId)((tx) => enroll(tx, { tenantId: A.tenantId, userId: learnerA.userId }, hipaaId));
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r1.data.created).toBe(true);
    expect(r2.data.enrollmentId).toBe(r1.data.enrollmentId);
    enrollmentId = r1.data.enrollmentId;
    const [c] = await systemDb().select().from(courses).where(eq(courses.id, hipaaId));
    const [e] = await systemDb().select().from(enrollments).where(eq(enrollments.id, enrollmentId));
    expect(e.courseVersionId).toBe(c.currentVersionId);
  });

  it("cannot complete an enrollment directly while lessons remain (database guard)", async () => {
    const e = await expectPgError(systemDb().update(enrollments).set({ status: "COMPLETED" }).where(eq(enrollments.id, enrollmentId)));
    expect(e.message).toMatch(/required lesson/);
  });

  it("knowledge checks complete only with all-correct answers graded on the server; manual 'complete' is ignored", async () => {
    const ctx = { tenantId: A.tenantId, userId: learnerA.userId };
    const p = (await as(A, learnerA.userId)((tx) => getPlayer(tx, enrollmentId, learnerA.userId)))!;
    const kc = p.flat.find((l) => l.type === "KNOWLEDGE_CHECK")!;
    const forced = await as(A, learnerA.userId)((tx) => recordProgress(tx, ctx, { enrollmentId, lessonId: kc.id, complete: true }));
    expect(forced.ok && forced.data.lessonCompleted).toBe(false);
    const wrong = await as(A, learnerA.userId)((tx) => submitKnowledgeCheck(tx, ctx, enrollmentId, kc.id, { k1: "a", k2: "a" }));
    expect(wrong.ok && wrong.data.allCorrect).toBe(false);
    const right = await as(A, learnerA.userId)((tx) => submitKnowledgeCheck(tx, ctx, enrollmentId, kc.id, { k1: "b", k2: "b" }));
    expect(right.ok && right.data.allCorrect).toBe(true);
  });

  it("bookmarks toggle; finishing lessons awaits the mandatory exam; passing it completes the course", async () => {
    const ctx = { tenantId: A.tenantId, userId: learnerA.userId };
    const p = (await as(A, learnerA.userId)((tx) => getPlayer(tx, enrollmentId, learnerA.userId)))!;
    const b1 = await as(A, learnerA.userId)((tx) => toggleBookmark(tx, ctx, enrollmentId, p.flat[0].id));
    expect(b1.ok && b1.data.bookmarked).toBe(true);
    const course = LIBRARY.find((c) => c.code === "CHITA-MC-001")!;
    const kcAnswers = new Map(course.modules.flatMap((m) => m.lessons).filter((l) => l.type === "KNOWLEDGE_CHECK").map((l) => [l.title, Object.fromEntries((l.mediaMeta!.questions ?? []).map((q) => [q.id, q.correct]))]));
    let last: string | undefined;
    for (const l of p.flat) {
      if (l.type === "KNOWLEDGE_CHECK") {
        const r = await as(A, learnerA.userId)((tx) => submitKnowledgeCheck(tx, ctx, enrollmentId, l.id, kcAnswers.get(l.title)!));
        if (!r.ok) throw new Error(r.error);
        last = r.data.enrollmentStatus;
      } else {
        const r = await as(A, learnerA.userId)((tx) => recordProgress(tx, ctx, { enrollmentId, lessonId: l.id, secondsSpent: 30, complete: true }));
        if (!r.ok) throw new Error(r.error);
        last = r.data.enrollmentStatus;
      }
    }
    expect(last).toBe("AWAITING_ASSESSMENT");
    const key = new Map(course.finalExam.questions.map((q) => [q.prompt, q.correct]));
    const attemptId = await as(A, learnerA.userId)(async (tx) => {
      const s = await startAttempt(tx, ctx, enrollmentId);
      if (!s.ok) throw new Error(s.error);
      const a = (await getAttempt(tx, s.data.attemptId))!;
      const r = await submitAttempt(tx, ctx, s.data.attemptId, Object.fromEntries(a.questions.map((q) => [q.id, key.get(q.prompt)])));
      if (!r.ok) throw new Error(r.error);
      return s.data.attemptId;
    });
    expect((await applyExamOutcome(systemDb(), attemptId)).completed).toBe(true);
    const [e] = await systemDb().select().from(enrollments).where(eq(enrollments.id, enrollmentId));
    expect(e.progressPct).toBe(100);
    expect(e.completedAt).not.toBeNull();
    const reopen = await expectPgError(systemDb().update(enrollments).set({ status: "IN_PROGRESS" }).where(eq(enrollments.id, enrollmentId)));
    expect(reopen.message).toMatch(/cannot be reopened/);
  });

  it("a mandatory examination keeps the enrollment at AWAITING_ASSESSMENT (no completion without the exam)", async () => {
    const bbp = (await systemDb().select().from(courses).where(and(isNull(courses.tenantId), eq(courses.code, "CHITA-MC-004"))))[0];
    const [bank] = await systemDb().select().from(questionBanks).where(eq(questionBanks.courseId, bbp.id));
    // Add the exam to a NEW version so the frozen published version is untouched.
    const scope = await platformScope();
    const nv = await createNewVersion(scope, bbp.id);
    if (!nv.ok) throw new Error(nv.error);
    await systemDb().insert(examinations).values({ courseVersionId: nv.data.versionId, questionBankId: bank.id, title: "Final", isMandatory: true });
    expect((await submitForReview(scope, bbp.id)).ok).toBe(true);
    // Separation of duties: the author of v2 cannot review it — a second administrator approves.
    const selfReview = await decide(scope, bbp.id, { decision: "APPROVED", comments: "ok" });
    expect(selfReview.ok).toBe(false);
    const { hashPassword } = await import("@/lib/auth/password");
    const [other] = await systemDb().insert(users).values({ email: `reviewer-${Date.now()}@test.example`, firstName: "Second", lastName: "Admin", isPlatformAdmin: true, passwordHash: await hashPassword("Integration-Test#2026") }).returning({ id: users.id });
    await approveAll({ ...scope, userId: other.id }, bbp.id);

    const ctx = { tenantId: A.tenantId, userId: learner2A.userId };
    const r = await as(A, learner2A.userId)((tx) => enroll(tx, ctx, bbp.id));
    if (!r.ok) throw new Error(r.error);
    const p = (await as(A, learner2A.userId)((tx) => getPlayer(tx, r.data.enrollmentId, learner2A.userId)))!;
    expect(p.version.id).toBe(nv.data.versionId);
    const course = LIBRARY.find((c) => c.code === "CHITA-MC-004")!;
    const answers = new Map(course.modules.flatMap((m) => m.lessons).filter((l) => l.type === "KNOWLEDGE_CHECK").map((l) => [l.title, Object.fromEntries((l.mediaMeta!.questions ?? []).map((q) => [q.id, q.correct]))]));
    let status = "";
    for (const l of p.flat) {
      const res = l.type === "KNOWLEDGE_CHECK"
        ? await as(A, learner2A.userId)((tx) => submitKnowledgeCheck(tx, ctx, r.data.enrollmentId, l.id, answers.get(l.title)!))
        : await as(A, learner2A.userId)((tx) => recordProgress(tx, ctx, { enrollmentId: r.data.enrollmentId, lessonId: l.id, complete: true }));
      if (!res.ok) throw new Error(res.error);
      status = res.data.enrollmentStatus;
    }
    expect(status).toBe("AWAITING_ASSESSMENT");
    const e = await expectPgError(systemDb().update(enrollments).set({ status: "COMPLETED" }).where(eq(enrollments.id, r.data.enrollmentId)));
    expect(e.message).toMatch(/mandatory examination/);
  });
});

describe("learner privacy and isolation", () => {
  it("learners cannot see or write other learners' enrollments; administrators with training.view_all can see them", async () => {
    const seenByOther = await as(A, learner2A.userId)((tx) => tx.select().from(enrollments).where(eq(enrollments.userId, learnerA.userId)));
    expect(seenByOther).toHaveLength(0);
    const seenByAdmin = await as(A, A.adminUserId)((tx) => tx.select().from(enrollments).where(eq(enrollments.userId, learnerA.userId)));
    expect(seenByAdmin.length).toBeGreaterThan(0);
    const [target] = await systemDb().select().from(enrollments).where(eq(enrollments.userId, learnerA.userId));
    const [l] = await systemDb().select({ id: lessons.id }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(eq(modules.courseVersionId, target.courseVersionId)).limit(1);
    const err = await expectPgError(as(A, learner2A.userId)((tx) => tx.insert(lessonProgress).values({ tenantId: A.tenantId, enrollmentId: target.id, lessonId: l.id, status: "COMPLETED" })));
    expect(err.code).toBe("42501");
    const upd = await as(A, learner2A.userId)((tx) => tx.update(enrollments).set({ progressPct: 0 }).where(eq(enrollments.id, target.id)).returning());
    expect(upd).toHaveLength(0);
  });

  it("another tenant cannot see, enroll in, or read enrollments of tenant-specific courses", async () => {
    const r = await tenantScope(A, A.adminUserId, (s) => createCourse(s, {
      code: "ALPHA-ORIENT-1", title: "Alpha Orientation", categoryId: "", passingScore: 80, estimatedMinutes: 30, description: "Organization-specific orientation for Alpha staff.", targetAudience: "All staff",
    }));
    expect(r.ok).toBe(false); // missing category
    const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
    const ok = await tenantScope(A, A.adminUserId, (s) => createCourse(s, { code: "ALPHA-ORIENT-1", title: "Alpha Orientation", categoryId: cat.id, passingScore: 80, estimatedMinutes: 30, description: "Organization-specific orientation for Alpha staff.", targetAudience: "All staff" }));
    if (!ok.ok) throw new Error(ok.error);
    const fromB = await as(B, B.adminUserId)((tx) => tx.select().from(courses).where(eq(courses.id, ok.data.courseId)));
    expect(fromB).toHaveLength(0);
    const enr = await as(B, B.adminUserId)((tx) => enroll(tx, { tenantId: B.tenantId, userId: B.adminUserId }, ok.data.courseId));
    expect(enr.ok).toBe(false);
    const theirs = await as(B, B.adminUserId)((tx) => tx.select().from(enrollments));
    expect(theirs.every((e) => e.tenantId === B.tenantId)).toBe(true);
  });
});

describe("tenant course builder and workflow", () => {
  it("authoring requires courses.author in the database as well as the service", async () => {
    const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
    const svc = await tenantScope(A, learnerA.userId, (s) => createCourse(s, { code: "NOPE-1", title: "Nope", categoryId: cat.id, passingScore: 80, estimatedMinutes: 30, description: "Should not be created by a learner.", targetAudience: "x" }));
    expect(svc.ok).toBe(false);
    const db = await expectPgError(as(A, learnerA.userId)((tx) => tx.insert(courses).values({ tenantId: A.tenantId, code: "NOPE-2", title: "x", categoryId: cat.id })));
    expect(db.code).toBe("42501");
  });

  it("build → submit → separation of duties → approvals → publish → new version keeps enrolled learners pinned", async () => {
    const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
    const author = await addMember(A, "training_director");
    const reviewer = await addMember(A, "org_admin");
    const created = await tenantScope(A, author.userId, (s) => createCourse(s, { code: "ALPHA-FIRE-1", title: "Alpha Fire Drill Procedures", categoryId: cat.id, passingScore: 80, estimatedMinutes: 20, description: "Our evacuation routes, alarm pull stations and roles during a fire drill.", targetAudience: "All staff" }));
    if (!created.ok) throw new Error(created.error);
    const courseId = created.data.courseId;
    const b0 = (await tenantScope(A, author.userId, (s) => getBuilderCourse(s, courseId)))!;

    expect((await tenantScope(A, author.userId, (s) => submitForReview(s, courseId))).ok).toBe(false); // empty course
    await tenantScope(A, author.userId, (s) => setObjectives(s, b0.working.id, "Locate exits\nUse RACE and PASS"));
    const m = await tenantScope(A, author.userId, (s) => addModule(s, b0.working.id, { title: "Evacuation" }));
    if (!m.ok) throw new Error(m.error);
    const badVideo = await tenantScope(A, author.userId, (s) => addLesson(s, m.data.id, { title: "Video", type: "VIDEO", mediaUrl: "http://insecure.example/v.mp4", durationMinutes: 3 }));
    expect(badVideo.ok).toBe(false); // https required
    const badKc = await tenantScope(A, author.userId, (s) => addLesson(s, m.data.id, { title: "Check", type: "KNOWLEDGE_CHECK", durationMinutes: 2, questionsJson: '[{"id":"q1","prompt":"Where?","options":[{"id":"a","text":"A"},{"id":"b","text":"B"}],"correct":"z","explanation":"x x x"}]' }));
    expect(badKc.ok).toBe(false); // correct must match an option
    const l = await tenantScope(A, author.userId, (s) => addLesson(s, m.data.id, { title: "Routes", type: "TEXT", body: "Exit through the nearest marked door.", durationMinutes: 5 }));
    expect(l.ok).toBe(true);
    expect((await tenantScope(A, author.userId, (s) => submitForReview(s, courseId))).ok).toBe(true);

    const selfReview = await tenantScope(A, author.userId, (s) => decide(s, courseId, { decision: "APPROVED" }));
    expect(selfReview.ok).toBe(false);
    expect(selfReview.ok || selfReview.error).toMatch(/Separation of duties/);
    const changes = await tenantScope(A, reviewer.userId, (s) => decide(s, courseId, { decision: "CHANGES_REQUESTED" }));
    expect(changes.ok).toBe(false); // comment required
    expect((await tenantScope(A, reviewer.userId, (s) => decide(s, courseId, { decision: "CHANGES_REQUESTED", comments: "Add assembly point" }))).ok).toBe(true);
    expect((await tenantScope(A, author.userId, (s) => getBuilderCourse(s, courseId)))!.working.status).toBe("DRAFT");
    expect((await tenantScope(A, author.userId, (s) => submitForReview(s, courseId))).ok).toBe(true);
    for (let i = 0; i < 3; i++) {
      const r = await tenantScope(A, reviewer.userId, (s) => decide(s, courseId, { decision: "APPROVED", comments: "ok" }));
      if (!r.ok) throw new Error(r.error);
    }
    const pub = (await tenantScope(A, reviewer.userId, (s) => getBuilderCourse(s, courseId)))!;
    expect(pub.working.status).toBe("PUBLISHED");
    expect(pub.course.currentVersionId).toBe(pub.working.id);

    const e = await as(A, learnerA.userId)((tx) => enroll(tx, { tenantId: A.tenantId, userId: learnerA.userId }, courseId));
    if (!e.ok) throw new Error(e.error);
    const nv = await tenantScope(A, author.userId, (s) => createNewVersion(s, courseId));
    if (!nv.ok) throw new Error(nv.error);
    const v2 = (await tenantScope(A, author.userId, (s) => getBuilderCourse(s, courseId)))!;
    expect(v2.working.versionNumber).toBe(2);
    expect(v2.modules[0].lessons[0].title).toBe("Routes");
    const [stillPinned] = await systemDb().select().from(enrollments).where(eq(enrollments.id, e.data.enrollmentId));
    expect(stillPinned.courseVersionId).toBe(pub.working.id);
  });
});

describe("one open enrollment per course", () => {
  it("the database enforces a single open enrollment per learner and course", async () => {
    const [open] = await systemDb().select().from(enrollments).where(and(eq(enrollments.userId, learner2A.userId), sql`status <> 'COMPLETED'`));
    const err = await expectPgError(systemDb().insert(enrollments).values({ tenantId: A.tenantId, userId: learner2A.userId, courseId: open.courseId, courseVersionId: open.courseVersionId }));
    expect(err.code).toBe("23505");
  });
});

describe("drag-and-drop ordering", () => {
  it("places modules and lessons at any position, moves lessons between modules, and refuses other tenants and published versions", async () => {
    const [cat] = await systemDb().select().from(courseCategories).where(eq(courseCategories.slug, "facility-programs"));
    const c = await tenantScope(A, A.adminUserId, (s) => createCourse(s, { code: "ALPHA-DND-1", title: "Alpha Ordering", categoryId: cat.id, passingScore: 80, estimatedMinutes: 20, description: "Course used to verify drag-and-drop ordering.", targetAudience: "All staff" }));
    if (!c.ok) throw new Error(c.error);
    const b0 = (await tenantScope(A, A.adminUserId, (s) => getBuilderCourse(s, c.data.courseId)))!;
    const mod = async (title: string) => { const r = await tenantScope(A, A.adminUserId, (s) => addModule(s, b0.working.id, { title })); if (!r.ok) throw new Error(r.error); return r.data.id; };
    const les = async (m: string, title: string) => { const r = await tenantScope(A, A.adminUserId, (s) => addLesson(s, m, { title, type: "TEXT", body: "Body text for the lesson.", durationMinutes: 2 })); if (!r.ok) throw new Error(r.error); return r.data.id; };
    const m1 = await mod("One"); const m2 = await mod("Two"); const m3 = await mod("Three");
    const a = await les(m1, "La"); const b = await les(m1, "Lb"); const d = await les(m1, "Lc"); const x = await les(m2, "Lx");
    const shape = async () => {
      const cur = (await tenantScope(A, A.adminUserId, (s) => getBuilderCourse(s, c.data.courseId)))!;
      return cur.modules.map((m) => `${m.title}[${m.lessons.map((l) => `${l.title}${l.sortOrder}`).join(",")}]`).join(" ");
    };
    const go = <T,>(fn: (s: AuthorScope) => Promise<T>) => tenantScope(A, A.adminUserId, fn);

    expect((await go((s) => placeModule(s, m3, 0))).ok).toBe(true);
    expect(await shape()).toBe("Three[] One[La1,Lb2,Lc3] Two[Lx1]");
    expect((await go((s) => placeLesson(s, a, m1, 2))).ok).toBe(true); // reorder within a module
    expect(await shape()).toBe("Three[] One[Lb1,Lc2,La3] Two[Lx1]");
    expect((await go((s) => placeLesson(s, b, m2, 0))).ok).toBe(true); // move to another module; both renumbered
    expect(await shape()).toBe("Three[] One[Lc1,La2] Two[Lb1,Lx2]");
    expect((await go((s) => placeLesson(s, d, m3, 99))).ok).toBe(true); // into an empty module; index clamped
    expect(await shape()).toBe("Three[Lc1] One[La1] Two[Lb1,Lx2]");

    // The arrow buttons cross module boundaries, so they can do everything dragging can.
    expect((await go((s) => moveLesson(s, d, "down"))).ok).toBe(true); // last in "Three" → first in "One"
    expect(await shape()).toBe("Three[] One[Lc1,La2] Two[Lb1,Lx2]");
    expect((await go((s) => moveLesson(s, d, "up"))).ok).toBe(true); // first in "One" → end of "Three"
    expect((await go((s) => moveLesson(s, d, "up"))).ok).toBe(true); // already at the very top: no change
    expect(await shape()).toBe("Three[Lc1] One[La1] Two[Lb1,Lx2]");

    // Another tenant can neither move these lessons nor drop into these modules.
    expect((await tenantScope(B, B.adminUserId, (s) => placeLesson(s, x, m1, 0))).ok).toBe(false);
    expect((await tenantScope(B, B.adminUserId, (s) => placeModule(s, m1, 0))).ok).toBe(false);
    // A learner without courses.author is refused.
    expect((await tenantScope(A, learnerA.userId, (s) => placeLesson(s, x, m1, 0))).ok).toBe(false);
    // A lesson cannot be dropped into a module of a different course.
    const other = await tenantScope(A, A.adminUserId, (s) => createCourse(s, { code: "ALPHA-DND-2", title: "Alpha Ordering Two", categoryId: cat.id, passingScore: 80, estimatedMinutes: 20, description: "Second course for the cross-course check.", targetAudience: "All staff" }));
    if (!other.ok) throw new Error(other.error);
    const ob = (await tenantScope(A, A.adminUserId, (s) => getBuilderCourse(s, other.data.courseId)))!;
    const om = await tenantScope(A, A.adminUserId, (s) => addModule(s, ob.working.id, { title: "Elsewhere" }));
    if (!om.ok) throw new Error(om.error);
    expect((await go((s) => placeLesson(s, x, om.data.id, 0))).ok).toBe(false);
    expect(await shape()).toBe("Three[Lc1] One[La1] Two[Lb1,Lx2]");

    // Once submitted for review the structure is locked.
    await go((s) => setObjectives(s, b0.working.id, "Know the order\nKeep the order"));
    const sub = await go((s) => submitForReview(s, c.data.courseId));
    if (!sub.ok) throw new Error(sub.error);
    expect((await go((s) => placeLesson(s, x, m1, 0))).ok).toBe(false);
    expect((await go((s) => placeModule(s, m1, 0))).ok).toBe(false);
  });
});
