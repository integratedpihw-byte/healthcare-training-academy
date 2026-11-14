import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { getPlayer } from "@/lib/learning/learner";
import { CourseOverview } from "./overview";

export const metadata = { title: "Course" };

/** Resume: jump to the last-viewed or first incomplete lesson, unless the course is finished. */
export default async function EnrollmentPage({ params, searchParams }: { params: Promise<{ enrollmentId: string }>; searchParams: Promise<{ done?: string }> }) {
  const { enrollmentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId)) notFound();
  const ctx = await requirePermission("learning.self");
  const p = await ctx.tx((tx) => getPlayer(tx, enrollmentId, ctx.user.id));
  if (!p) notFound();
  const { done } = await searchParams;
  const finished = ["COMPLETED", "AWAITING_ASSESSMENT"].includes(p.e.status);
  if (!finished && !done && p.resumeLessonId) redirect(`/learning/${enrollmentId}/${p.resumeLessonId}`);
  return <CourseOverview p={p} />;
}
