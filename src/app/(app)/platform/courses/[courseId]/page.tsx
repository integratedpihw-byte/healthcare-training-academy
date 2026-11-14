import Link from "next/link";
import { notFound } from "next/navigation";
import { authorRead, BUILDER_BASE } from "@/lib/learning/author-context";
import { getBuilderCourse } from "@/lib/learning/builder";
import { PageHeader } from "@/components/ui";
import { CourseBuilder } from "@/components/builder/views";

export const metadata = { title: "Course builder" };

export default async function Page({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string; created?: string; msg?: string }> }) {
  const { courseId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) notFound();
  const { data: b, can, categories } = await authorRead("platform", (s) => getBuilderCourse(s, courseId));
  if (!b) notFound();
  const base = BUILDER_BASE["platform"];
  return (
    <>
      <PageHeader title={b.course.title} description={`${b.course.code} · course builder`} actions={<Link href={base} className="text-sm font-semibold text-teal-700 hover:underline">← All courses</Link>} />
      <CourseBuilder b={b} kind="platform" base={base} categories={categories} can={can} flash={await searchParams} />
    </>
  );
}
