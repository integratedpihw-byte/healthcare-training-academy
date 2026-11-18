import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { getCourseDetail } from "@/lib/learning/learner";
import { DEPARTMENT_LABEL, ENROLLMENT_LABEL, LESSON_TYPE_LABEL, minutes } from "@/lib/learning/labels";
import { CERT_TITLE, PROGRAM_LABEL } from "@/lib/certificates/labels";
import { Alert, Badge, Button, ButtonLink, Card, PageHeader, fmtDate } from "@/components/ui";
import { enrollAction } from "../../learning/actions";
import { courseAccess, usd } from "@/lib/billing/commerce";
import { stripeConfigured } from "@/lib/billing/stripe";
import { BuySeatForSelf, BuyTraining } from "@/components/billing/buy-training";

export const metadata = { title: "Course details" };

type Ref = { agency?: string; citation?: string; title?: string; url?: string; publisher?: string; publishedOn?: string; accessedOn?: string; note?: string };

export default async function CourseDetailPage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string; checkout?: string }> }) {
  const { courseId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) notFound();
  const ctx = await requirePermission("courses.view");
  const [d, access] = await ctx.tx(async (tx) => {
    const detail = await getCourseDetail(tx, courseId, ctx.user.id);
    return [detail, detail ? await courseAccess(tx, ctx.tenant.id, courseId) : null] as const;
  });
  if (!d || !access) notFound();
  const { error, checkout } = await searchParams;
  const { course, version } = d;
  const regs = (version.regulatoryReferences as Ref[]) ?? [];
  const srcs = ((version.sourceReferences as Ref[]) ?? []).filter((s) => s.url);
  const renewal = ((version.sourceReferences as Ref[]) ?? []).find((s) => s.note)?.note;
  const lessonCount = d.outline.reduce((n, m) => n + m.lessons.length, 0);
  const open = d.enrollment && d.enrollment.status !== "COMPLETED" && d.enrollment.status !== "WITHDRAWN";
  const isDemoPublish = version.reviewerName?.startsWith("DEMO");
  return (
    <>
      <PageHeader title={course.title} description={`${course.code} · ${DEPARTMENT_LABEL[d.department]} · Version ${version.versionNumber}`} actions={<Link href="/catalog" className="text-sm font-semibold text-teal-700 hover:underline">← Catalog</Link>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          {checkout === "success" && <Alert tone="green">Payment received. The seat appears here as soon as Stripe confirms it — refresh in a moment, then enroll.</Alert>}
          {checkout === "cancelled" && <Alert tone="blue">Checkout was cancelled; nothing was charged.</Alert>}
          {isDemoPublish && <Alert tone="amber">DEMO: this course was published for demonstration without a qualified subject-matter or clinical review. Do not rely on it for compliance until reviewed.</Alert>}
          <Card title="About this course">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="teal">{PROGRAM_LABEL[course.programClassification]?.label}</Badge>
              {course.certificateEligible && <Badge tone="gray">{CERT_TITLE[course.certificateType]}</Badge>}
              <span className="text-xs text-slate-500">{(course.estimatedMinutes / 60).toFixed(1)} instructional hours</span>
            </div>
            {version.credentialNotice && <div className="mb-4"><Alert tone="amber"><strong>What this course is and is not.</strong> {version.credentialNotice}</Alert></div>}
            <p className="text-sm leading-relaxed text-slate-700">{version.description}</p>
            <h3 className="mt-5 text-sm font-semibold text-navy-900">Who should take it</h3>
            <p className="mt-1 text-sm text-slate-700">{version.targetAudience}</p>
            {version.renewalRequirements && (<><h3 className="mt-5 text-sm font-semibold text-navy-900">Renewal</h3><p className="mt-1 text-sm text-slate-700">{version.renewalRequirements}</p></>)}
            <p className="mt-4 text-xs text-slate-500">{PROGRAM_LABEL[course.programClassification]?.help}</p>
          </Card>
          <Card title="Learning objectives">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">{d.objectives.map((o) => <li key={o.id}>{o.text}</li>)}</ol>
          </Card>
          <Card title={`Course outline (${d.outline.length} modules · ${lessonCount} lessons)`}>
            <ol className="space-y-4">
              {d.outline.map((m) => (
                <li key={m.id}>
                  <div className="font-medium text-navy-900">{m.title}</div>
                  {m.summary && <div className="text-xs text-slate-500">{m.summary}</div>}
                  <ul className="mt-2 space-y-1 border-l-2 border-teal-100 pl-4 text-sm text-slate-700">
                    {m.lessons.map((l) => <li key={l.id} className="flex justify-between gap-4"><span>{l.title}</span><span className="whitespace-nowrap text-xs text-slate-500">{LESSON_TYPE_LABEL[l.type]} · {l.durationMinutes} min</span></li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
          {(regs.length > 0 || srcs.length > 0) && (
            <Card title="Regulatory references and sources">
              {regs.length > 0 && (
                <ul className="space-y-1.5 text-sm">{regs.map((r, i) => <li key={i}><span className="font-medium text-navy-900">{r.agency}</span> — {r.citation}: {r.url ? <a className="text-teal-700 underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> : r.title}</li>)}</ul>
              )}
              {srcs.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-semibold text-navy-900">Sources</h3>
                  <ul className="mt-1 space-y-1.5 text-sm">{srcs.map((s, i) => <li key={i}><a className="text-teal-700 underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> — {s.publisher}{s.publishedOn ? `, ${s.publishedOn}` : ""}{s.accessedOn ? ` (accessed ${s.accessedOn})` : ""}</li>)}</ul>
                </>
              )}
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Estimated time</dt><dd className="font-medium">{minutes(course.estimatedMinutes)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Passing score</dt><dd className="font-medium">{course.passingScore}%</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Certificate</dt><dd className="font-medium">{course.certificateEligible ? "Course completion" : "No"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Renewal</dt><dd className="font-medium">{course.renewalMonths ? `Every ${course.renewalMonths} months` : "Set by your organization"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Published</dt><dd>{fmtDate(version.publishedAt)}</dd></div>
              {d.rating.n > 0 && <div className="flex justify-between"><dt className="text-slate-600">Learner rating</dt><dd>{d.rating.avg} / 5 ({d.rating.n})</dd></div>}
            </dl>
            {renewal && <p className="mt-3 text-xs text-slate-500">{renewal}</p>}
            {access.kind !== "FREE" && (
              <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                {access.kind === "SUBSCRIPTION" ? "Included with your organization's subscription." : access.kind === "SEAT" ? `Paid seat available (${access.seatsLeft} remaining for your organization).` : `This course is ${usd(access.priceCents)} per learner seat.`}
              </p>
            )}
            <div className="mt-5">
              {open ? (
                <ButtonLink href={`/learning/${d.enrollment!.id}`} variant="teal" className="w-full">Continue ({d.enrollment!.progressPct}%)</ButtonLink>
              ) : access.kind === "PURCHASE_REQUIRED" && !d.enrollment ? (
                ctx.can("billing.manage") ? (
                  <BuyTraining items={[]} fixed={{ value: `COURSE:${course.id}`, label: course.title }} online={stripeConfigured()} back={`/catalog/${course.id}`} />
                ) : ctx.tenant.type === "INDIVIDUAL" && ctx.can("learning.self") ? (
                  <BuySeatForSelf courseId={course.id} priceCents={access.priceCents} online={stripeConfigured()} />
                ) : (
                  <p className="text-sm text-slate-600">Ask your training or billing administrator for a seat in this course.</p>
                )
              ) : ctx.can("learning.self") ? (
                <form action={enrollAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <Button type="submit" variant="teal" className="w-full">{d.enrollment?.status === "COMPLETED" ? "Retake course" : "Enroll and start"}</Button>
                </form>
              ) : null}
              {d.enrollment && <p className="mt-2 text-center text-xs text-slate-500">Status: <Badge tone={ENROLLMENT_LABEL[d.enrollment.status].tone}>{ENROLLMENT_LABEL[d.enrollment.status].label}</Badge></p>}
            </div>
          </Card>
          <Card title="Completion criteria">
            <p className="text-sm text-slate-700">{version.completionCriteria ?? "Complete all required lessons."}</p>
          </Card>
          <Card title="Authorship">
            <dl className="space-y-2 text-xs text-slate-600">
              <div><dt className="font-medium text-slate-800">Author</dt><dd>{version.authorName ?? "Organization author"}</dd></div>
              <div><dt className="font-medium text-slate-800">Reviewer</dt><dd>{version.reviewerName ?? "Recorded in approval history"}</dd></div>
              <div><dt className="font-medium text-slate-800">Clinical review required</dt><dd>{version.clinicalReviewRequired ? "Yes" : "No"}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
