import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { getBuilderCourse, getBuilderLesson, listManagedCourses } from "@/lib/learning/builder";
import { REG_KEYS, SRC_KEYS, STAGE_LABEL, refsToText } from "@/lib/learning/builder";
import { CONTENT_STATUS_TONE, LESSON_TYPE_LABEL } from "@/lib/learning/labels";
import { Alert, Badge, Card, EmptyState, Field, Input, Select, Table, Td, Textarea, fmtDate, fmtDateTime } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { LessonContent } from "@/components/learning/lesson-content";
import { LessonMediaUpload } from "./lesson-media-upload";
import { SortableEmpty, SortableItem, SortableStructure } from "./sortable";
import {
  addLessonAction,
  addModuleAction,
  createCourseAction,
  objectivesAction,
  structureAction,
  updateCourseAction,
  updateLessonAction,
  updateModuleAction,
  workflowAction,
} from "@/app/(app)/builder-actions";
import type { PermissionKey } from "@/lib/rbac/catalog";

type Kind = "tenant" | "platform";
type Category = { id: string; name: string; tenantId: string | null };

export function ScopeInput({ kind }: { kind: Kind }) {
  return <input type="hidden" name="scope" value={kind} />;
}

// ---------------------------------------------------------------------------
// Course list
// ---------------------------------------------------------------------------

export function ManagedCourseList({ rows, base }: { rows: Awaited<ReturnType<typeof listManagedCourses>>; base: string }) {
  return (
    <Table head={["Course", "Category", "Published", "Working version", "Updated"]} empty={rows.length === 0 ? <EmptyState>No courses yet. Create the first one below.</EmptyState> : undefined}>
      {rows.map((c) => (
        <tr key={c.id}>
          <Td><Link href={`${base}/${c.id}`} className="font-medium text-teal-700 hover:underline">{c.title}</Link><div className="text-xs text-slate-500">{c.code}</div></Td>
          <Td>{c.category}</Td>
          <Td>{c.publishedVersion ? `v${c.publishedVersion}` : "—"}{c.status === "ARCHIVED" && <span className="ml-2"><Badge>Archived</Badge></span>}</Td>
          <Td><span className="mr-2">v{c.latestVersion}</span><Badge tone={CONTENT_STATUS_TONE[c.latestStatus]}>{c.latestStatus.replace("_", " ")}</Badge></Td>
          <Td>{fmtDate(c.updatedAt)}</Td>
        </tr>
      ))}
    </Table>
  );
}

// ---------------------------------------------------------------------------
// Course settings form (create + edit)
// ---------------------------------------------------------------------------

type CourseValues = {
  code?: string; title?: string; categoryId?: string; isRequiredByDefault?: boolean; certificateEligible?: boolean; passingScore?: number;
  renewalMonths?: number | null; estimatedMinutes?: number; description?: string; targetAudience?: string; prerequisites?: string[];
  completionCriteria?: string | null; clinicalReviewRequired?: boolean; regulatoryReferences?: unknown; sourceReferences?: unknown;
};

export function CourseFields({ categories, v = {}, codeLocked = false, versionEditable = true }: { categories: Category[]; v?: CourseValues; codeLocked?: boolean; versionEditable?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Course ID" name="code" hint={codeLocked ? "Locked after first publication" : "e.g. SCG-ALF-010"}>
          <Input id="code" name="code" defaultValue={v.code} required readOnly={codeLocked} className={codeLocked ? "bg-slate-50" : ""} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Course title" name="title"><Input id="title" name="title" defaultValue={v.title} required /></Field>
        </div>
        <Field label="Category" name="categoryId">
          <Select id="categoryId" name="categoryId" defaultValue={v.categoryId ?? ""} required>
            <option value="" disabled>Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Estimated minutes" name="estimatedMinutes"><Input id="estimatedMinutes" name="estimatedMinutes" type="number" min={5} max={2400} defaultValue={v.estimatedMinutes ?? 60} required /></Field>
        <Field label="Passing score (%)" name="passingScore"><Input id="passingScore" name="passingScore" type="number" min={50} max={100} defaultValue={v.passingScore ?? 80} required /></Field>
        <Field label="Renewal (months)" name="renewalMonths" hint="Leave blank unless a verified requirement or your policy sets one">
          <Input id="renewalMonths" name="renewalMonths" type="number" min={1} max={120} defaultValue={v.renewalMonths ?? ""} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6 text-sm text-slate-700">
        <label className="flex items-center gap-2"><input type="checkbox" name="isRequiredByDefault" defaultChecked={v.isRequiredByDefault} /> Commonly required</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="certificateEligible" defaultChecked={v.certificateEligible ?? true} /> Certificate eligible</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="clinicalReviewRequired" defaultChecked={v.clinicalReviewRequired} disabled={!versionEditable} /> Requires clinical approval</label>
      </div>
      <fieldset disabled={!versionEditable} className="space-y-4 disabled:opacity-70">
        {!versionEditable && <p className="text-xs text-amber-800">Description and references belong to the version and can only be edited while it is a draft.</p>}
        <Field label="Description" name="description"><Textarea id="description" name="description" rows={4} defaultValue={v.description} required /></Field>
        <Field label="Target audience" name="targetAudience"><Textarea id="targetAudience" name="targetAudience" rows={2} defaultValue={v.targetAudience} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prerequisite course IDs" name="prerequisites" hint="Comma separated, e.g. CHITA-MC-001"><Input id="prerequisites" name="prerequisites" defaultValue={v.prerequisites?.join(", ")} /></Field>
          <Field label="Completion criteria" name="completionCriteria"><Input id="completionCriteria" name="completionCriteria" defaultValue={v.completionCriteria ?? ""} /></Field>
        </div>
        <Field label="Regulatory references" name="regulatoryReferences" hint="One per line: Agency | Citation | Title | URL">
          <Textarea id="regulatoryReferences" name="regulatoryReferences" rows={3} defaultValue={refsToText(v.regulatoryReferences, REG_KEYS)} className="font-mono text-xs" />
        </Field>
        <Field label="Sources" name="sourceReferences" hint="One per line: Title | Publisher | URL | Published (YYYY-MM-DD) | Accessed (YYYY-MM-DD)">
          <Textarea id="sourceReferences" name="sourceReferences" rows={3} defaultValue={refsToText(v.sourceReferences, SRC_KEYS)} className="font-mono text-xs" />
        </Field>
      </fieldset>
    </div>
  );
}

export function NewCourseForm({ kind, categories }: { kind: Kind; categories: Category[] }) {
  return (
    <ActionForm action={createCourseAction} submitLabel="Create draft course" pendingText="Creating…">
      <ScopeInput kind={kind} />
      <CourseFields categories={categories} />
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Course builder
// ---------------------------------------------------------------------------

type B = NonNullable<Awaited<ReturnType<typeof getBuilderCourse>>>;

export function CourseBuilder({ b, kind, base, categories, can, flash }: { b: B; kind: Kind; base: string; categories: Category[]; can: (p: PermissionKey) => boolean; flash?: { error?: string; created?: string; msg?: string } }) {
  const draft = b.working.status === "DRAFT";
  const canAuthor = can("courses.author");
  const struct = (op: string, targetId: string, label: React.ReactNode, title: string, confirm?: boolean) => (
    <form action={structureAction} className="inline">
      <ScopeInput kind={kind} />
      <input type="hidden" name="courseId" value={b.course.id} />
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="targetId" value={targetId} />
      <button type="submit" title={title} aria-label={title} className={confirm ? "rounded p-1 text-red-700 hover:bg-red-50" : "rounded p-1 text-slate-600 hover:bg-slate-100"}>{label}</button>
    </form>
  );
  const sortable = draft && canAuthor;
  const Sort = ({ children }: { children: React.ReactNode }) => (sortable ? <SortableStructure scope={kind} courseId={b.course.id}>{children}</SortableStructure> : <>{children}</>);
  const versionApprovals = b.approvals.filter((a) => a.courseVersionId === b.working.id);
  return (
    <div className="space-y-6">
      {flash?.error && <Alert>{flash.error}</Alert>}
      {flash?.msg && <Alert tone="green">{flash.msg}</Alert>}
      {flash?.created && <Alert tone="green">Draft created. Add objectives, modules and lessons, then submit for review.</Alert>}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2">Version {b.working.versionNumber} <Badge tone={CONTENT_STATUS_TONE[b.working.status]}>{b.working.status.replace("_", " ")}</Badge></span>}>
            {!draft && <p className="mb-4 text-sm text-slate-600">This version is {b.working.status === "PUBLISHED" ? "published and frozen" : "in the approval workflow"}. {b.working.status === "PUBLISHED" ? "Create a new version to make changes; learners already enrolled keep the version they started." : "Content can be edited again if a reviewer requests changes."}</p>}
            {canAuthor ? (
              <ActionForm action={updateCourseAction} submitLabel="Save course settings" pendingText="Saving…">
                <ScopeInput kind={kind} />
                <input type="hidden" name="courseId" value={b.course.id} />
                <CourseFields categories={categories} codeLocked={!!b.course.currentVersionId} versionEditable={draft} v={{ ...b.course, ...b.working }} />
              </ActionForm>
            ) : (
              <p className="text-sm text-slate-700">{b.working.description}</p>
            )}
          </Card>

          <Card title="Learning objectives">
            {draft && canAuthor ? (
              <ActionForm action={objectivesAction} submitLabel="Save objectives" variant="secondary">
                <ScopeInput kind={kind} />
                <input type="hidden" name="courseId" value={b.course.id} />
                <input type="hidden" name="versionId" value={b.working.id} />
                <Field label="One objective per line" name="objectives"><Textarea id="objectives" name="objectives" rows={6} defaultValue={b.objectives.map((o) => o.text).join("\n")} /></Field>
              </ActionForm>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm">{b.objectives.map((o) => <li key={o.id}>{o.text}</li>)}</ol>
            )}
          </Card>

          <Card title={`Modules and lessons (${b.modules.length})`}>
            <Sort>
            <ol className="space-y-5">
              {b.modules.map((m, mi) => (
                <SortableItem key={m.id} kind="module" id={m.id} parentId={b.working.id} index={mi} label={m.title} className="rounded-lg border border-slate-200">
                  <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-navy-50/60 py-2 pr-4 ${sortable ? "pl-4 md:pl-8" : "pl-4"}`}>
                    <div className="font-medium text-navy-900">{m.title}</div>
                    {draft && canAuthor && (
                      <div className="flex items-center">
                        {mi > 0 && struct("module-up", m.id, <ArrowUp className="h-4 w-4" />, "Move module up")}
                        {mi < b.modules.length - 1 && struct("module-down", m.id, <ArrowDown className="h-4 w-4" />, "Move module down")}
                        {struct("module-delete", m.id, <Trash2 className="h-4 w-4" />, "Delete module and its lessons", true)}
                      </div>
                    )}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {m.lessons.map((l, li) => (
                      <SortableItem key={l.id} kind="lesson" id={l.id} parentId={m.id} index={li} label={l.title} className={`flex flex-wrap items-center justify-between gap-2 py-2 pr-4 text-sm ${sortable ? "pl-4 md:pl-8" : "pl-4"}`}>
                        <Link href={`${base}/${b.course.id}/lessons/${l.id}`} className="text-slate-800 hover:text-teal-700 hover:underline">{l.title}</Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{LESSON_TYPE_LABEL[l.type]} · {l.durationMinutes} min{l.isRequired ? "" : " · optional"}</span>
                          {draft && canAuthor && (
                            <>
                              {(li > 0 || mi > 0) && struct("lesson-up", l.id, <ArrowUp className="h-4 w-4" />, li > 0 ? "Move lesson up" : "Move lesson to the previous module")}
                              {(li < m.lessons.length - 1 || mi < b.modules.length - 1) && struct("lesson-down", l.id, <ArrowDown className="h-4 w-4" />, li < m.lessons.length - 1 ? "Move lesson down" : "Move lesson to the next module")}
                              {struct("lesson-delete", l.id, <Trash2 className="h-4 w-4" />, "Delete lesson", true)}
                            </>
                          )}
                        </div>
                      </SortableItem>
                    ))}
                    {m.lessons.length === 0 && (sortable ? <SortableEmpty moduleId={m.id}>No lessons yet. Drag a lesson here, or add one below.</SortableEmpty> : <li className="px-4 py-2 text-xs text-slate-500">No lessons yet.</li>)}
                  </ul>
                  {draft && canAuthor && (
                    <details className="border-t border-slate-100 px-4 py-3">
                      <summary className="cursor-pointer text-sm font-semibold text-teal-700">Add a lesson · edit module</summary>
                      <div className="mt-4 grid gap-6 lg:grid-cols-2">
                        <ActionForm action={addLessonAction} submitLabel="Add lesson" variant="teal">
                          <ScopeInput kind={kind} />
                          <input type="hidden" name="courseId" value={b.course.id} />
                          <input type="hidden" name="moduleId" value={m.id} />
                          <LessonFields compact idPrefix={`m${mi}-`} />
                        </ActionForm>
                        <ActionForm action={updateModuleAction} submitLabel="Save module" variant="secondary">
                          <ScopeInput kind={kind} />
                          <input type="hidden" name="courseId" value={b.course.id} />
                          <input type="hidden" name="moduleId" value={m.id} />
                          <Field label="Module title" name="title" htmlFor={`mt-${m.id}`}><Input id={`mt-${m.id}`} name="title" defaultValue={m.title} required /></Field>
                          <Field label="Summary" name="summary" htmlFor={`ms-${m.id}`}><Textarea id={`ms-${m.id}`} name="summary" rows={2} defaultValue={m.summary ?? ""} /></Field>
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </SortableItem>
              ))}
            </ol>
            </Sort>
            {draft && canAuthor && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <ActionForm action={addModuleAction} submitLabel="Add module" variant="secondary" resetOnSuccess>
                  <ScopeInput kind={kind} />
                  <input type="hidden" name="courseId" value={b.course.id} />
                  <input type="hidden" name="versionId" value={b.working.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="New module title" name="title" htmlFor="new-module-title"><Input id="new-module-title" name="title" required placeholder="e.g. 1. Introduction" /></Field>
                    <Field label="Summary (optional)" name="summary" htmlFor="new-module-summary"><Input id="new-module-summary" name="summary" /></Field>
                  </div>
                </ActionForm>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <WorkflowPanel b={b} kind={kind} can={can} />
          <Card title="Final examination">
            <p className="text-sm text-slate-600">Configure the exam for this version and maintain the course question bank (all 9 question types).</p>
            <Link href={`${base}/${b.course.id}/exam`} className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline">Examination &amp; question bank →</Link>
          </Card>
          <Card title="Version history">
            <ul className="space-y-2 text-sm">
              {b.versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between">
                  <span>Version {v.versionNumber}{v.id === b.course.currentVersionId && <span className="ml-2 text-xs text-emerald-700">(live)</span>}</span>
                  <span className="flex items-center gap-2"><Badge tone={CONTENT_STATUS_TONE[v.status]}>{v.status.replace("_", " ")}</Badge><span className="text-xs text-slate-500">{fmtDate(v.publishedAt ?? v.createdAt)}</span></span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Approval history">
            {b.approvals.length === 0 ? <p className="text-sm text-slate-600">No decisions yet.</p> : (
              <ul className="space-y-3 text-sm">
                {b.approvals.map((a) => {
                  const v = b.versions.find((x) => x.id === a.courseVersionId);
                  return (
                    <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                      <div className="flex items-center gap-2"><span className="font-medium">{STAGE_LABEL[a.stage as keyof typeof STAGE_LABEL]}</span><Badge tone={a.decision === "APPROVED" ? "green" : "amber"}>{a.decision.replace("_", " ")}</Badge></div>
                      <div className="text-xs text-slate-500">v{v?.versionNumber} · {fmtDateTime(a.decidedAt)}{a.reviewerCredentials ? ` · ${a.reviewerCredentials}` : ""}</div>
                      {a.comments && <p className="mt-1 text-slate-700">{a.comments}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
            {versionApprovals.length === 0 && b.working.status === "IN_REVIEW" && <p className="mt-2 text-xs text-slate-500">Awaiting the first decision for this version.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function WorkflowPanel({ b, kind, can }: { b: B; kind: Kind; can: (p: PermissionKey) => boolean }) {
  const hidden = (op: string) => (
    <>
      <ScopeInput kind={kind} />
      <input type="hidden" name="courseId" value={b.course.id} />
      <input type="hidden" name="op" value={op} />
    </>
  );
  const stagePerm: Record<string, PermissionKey> = { REVIEW: "courses.review", CLINICAL_APPROVAL: "courses.approve.clinical", COMPLIANCE_APPROVAL: "courses.approve.compliance", PUBLISH: "courses.publish" };
  const steps = ["Draft", "Editorial review", ...(b.working.clinicalReviewRequired ? ["Clinical approval"] : []), "Compliance approval", "Published"];
  const current = b.working.status === "DRAFT" ? 0 : b.working.status === "PUBLISHED" || b.working.status === "ARCHIVED" ? steps.length - 1 : steps.indexOf(b.nextStage ? STAGE_LABEL[b.nextStage] : "Published");
  return (
    <Card title="Approval workflow">
      <ol className="mb-5 space-y-1.5 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i < current ? "bg-emerald-600 text-white" : i === current ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-600"}`}>{i < current ? "✓" : i + 1}</span>
            <span className={i === current ? "font-semibold text-navy-900" : "text-slate-600"}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="space-y-4">
        {b.working.status === "DRAFT" && can("courses.author") && (
          <ActionForm action={workflowAction} submitLabel="Submit for review" variant="teal">{hidden("submit")}</ActionForm>
        )}
        {b.nextStage && (can(stagePerm[b.nextStage]) ? (
          <ActionForm action={workflowAction} submitLabel={b.nextStage === "PUBLISH" ? "Publish to catalog" : "Record decision"} variant="teal">
            {hidden("decide")}
            <p className="text-sm font-medium text-navy-900">Awaiting: {STAGE_LABEL[b.nextStage]}</p>
            {b.nextStage === "PUBLISH" ? <input type="hidden" name="decision" value="APPROVED" /> : (
              <Field label="Decision" name="decision">
                <Select id="decision" name="decision" defaultValue="APPROVED">
                  <option value="APPROVED">Approve</option>
                  <option value="CHANGES_REQUESTED">Request changes (returns to draft)</option>
                  <option value="REJECTED">Reject (returns to draft)</option>
                </Select>
              </Field>
            )}
            {b.nextStage === "CLINICAL_APPROVAL" && (
              <Field label="Your clinical credentials" name="reviewerCredentials" hint="License type, number and state — recorded with the approval"><Input id="reviewerCredentials" name="reviewerCredentials" placeholder="RN, FL license RN0000000" /></Field>
            )}
            <Field label="Comments" name="comments"><Textarea id="comments" name="comments" rows={2} /></Field>
          </ActionForm>
        ) : (
          <p className="text-sm text-slate-600">Awaiting {STAGE_LABEL[b.nextStage].toLowerCase()} by a user with the required permission.</p>
        ))}
        {b.working.status === "PUBLISHED" && can("courses.author") && (
          <ActionForm action={workflowAction} submitLabel="Create new version" variant="secondary">{hidden("new-version")}</ActionForm>
        )}
        {b.course.status === "PUBLISHED" && can("courses.publish") && (
          <ActionForm action={workflowAction} submitLabel="Archive course" variant="ghost" confirm="Archive this course? It will be removed from the catalog. Learners already enrolled keep access.">{hidden("archive")}</ActionForm>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lesson editor
// ---------------------------------------------------------------------------

type LessonValues = { title?: string; type?: string; body?: string; mediaUrl?: string | null; durationMinutes?: number; isRequired?: boolean; mediaMeta?: unknown };

export function LessonFields({ v = {}, compact = false, idPrefix = "" }: { v?: LessonValues; compact?: boolean; idPrefix?: string }) {
  const fid = (n: string) => `${idPrefix}${n}`;
  const meta = (v.mediaMeta ?? {}) as { questions?: unknown; durationSeconds?: number };
  return (
    <div className="space-y-4">
      <Field label="Lesson title" name="title" htmlFor={fid("title")}><Input id={fid("title")} name="title" defaultValue={v.title} required /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" name="type" htmlFor={fid("type")}>
          <Select id={fid("type")} name="type" defaultValue={v.type ?? "TEXT"}>
            {Object.entries(LESSON_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Minutes" name="durationMinutes" htmlFor={fid("durationMinutes")}><Input id={fid("durationMinutes")} name="durationMinutes" type="number" min={1} max={600} defaultValue={v.durationMinutes ?? 5} required /></Field>
        <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" name="isRequired" defaultChecked={v.isRequired ?? true} /> Required</label>
      </div>
      <Field label="Content (Markdown)" name="body" htmlFor={fid("body")} hint="Presentation: separate slides with a line containing only ---. Raw HTML is not rendered.">
        <Textarea id={fid("body")} name="body" rows={compact ? 5 : 16} defaultValue={v.body} className="font-mono text-xs" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Media link (video / download)" name="mediaUrl" htmlFor={fid("mediaUrl")} hint="https:// MP4/WebM file, YouTube or Vimeo, or a document link"><Input id={fid("mediaUrl")} name="mediaUrl" defaultValue={v.mediaUrl ?? ""} /></Field>
        <Field label="Video length (seconds)" name="videoDurationSeconds" htmlFor={fid("videoDurationSeconds")} hint="Required for video files"><Input id={fid("videoDurationSeconds")} name="videoDurationSeconds" type="number" min={1} defaultValue={meta.durationSeconds ?? ""} /></Field>
      </div>
      {!compact && (
        <Field label="Knowledge check questions (JSON)" name="questionsJson" hint='For knowledge checks: [{"id":"q1","prompt":"…","options":[{"id":"a","text":"…"},{"id":"b","text":"…"}],"correct":"a","explanation":"…"}] — use an array for multiple correct answers.'>
          <Textarea id="questionsJson" name="questionsJson" rows={8} defaultValue={meta.questions ? JSON.stringify(meta.questions, null, 2) : ""} className="font-mono text-xs" />
        </Field>
      )}
    </div>
  );
}

type L = NonNullable<Awaited<ReturnType<typeof getBuilderLesson>>>;

export function LessonEditor({ row, kind, base, canAuthor, saved }: { row: L; kind: Kind; base: string; canAuthor: boolean; saved?: boolean }) {
  const draft = row.version.status === "DRAFT";
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title={draft && canAuthor ? "Edit lesson" : "Lesson (read-only — version is not a draft)"}>
        {saved && <div className="mb-4"><Alert tone="green">Lesson saved.</Alert></div>}
        {draft && canAuthor ? (
          <ActionForm action={updateLessonAction} submitLabel="Save lesson" pendingText="Saving…">
            <ScopeInput kind={kind} />
            <input type="hidden" name="courseId" value={row.course.id} />
            <input type="hidden" name="lessonId" value={row.lesson.id} />
            <LessonFields v={row.lesson} />
          </ActionForm>
        ) : null}
        {draft && canAuthor && row.lesson.tenantId ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
            <LessonMediaUpload lessonId={row.lesson.id} inputId="mediaUrl" />
          </div>
        ) : null}
        {draft && canAuthor ? (
          <p className="mt-2 text-xs text-slate-500">Uploaded media is stored privately and shown only to people who can open this course.</p>
        ) : (
          <p className="text-sm text-slate-600">Create a new course version to edit this lesson.</p>
        )}
        <Link href={`${base}/${row.course.id}`} className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:underline">← Back to course</Link>
      </Card>
      <Card title="Learner preview">
        <h2 className="mb-4 text-xl font-bold text-navy-900">{row.lesson.title}</h2>
        <LessonContent lesson={row.lesson} />
      </Card>
    </div>
  );
}
