import Link from "next/link";
import { notFound } from "next/navigation";
import { authorRead, BUILDER_BASE } from "@/lib/learning/author-context";
import { getExamAuthoring } from "@/lib/assessment/authoring";
import { PageHeader } from "@/components/ui";
import { ExamAuthoring } from "@/components/builder/exam-views";

export const metadata = { title: "Examination and question bank" };

export default async function Page({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { courseId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) notFound();
  const { data, can } = await authorRead("platform", (s) => getExamAuthoring(s, courseId));
  if (!data) notFound();
  return (
    <>
      <PageHeader title="Examination and question bank" description={`${data.course.title} · ${data.course.code}`} actions={<Link href={`${BUILDER_BASE["platform"]}/${courseId}`} className="text-sm font-semibold text-teal-700 hover:underline">← Course builder</Link>} />
      <ExamAuthoring a={data} kind="platform" canAuthor={can("courses.author")} error={(await searchParams).error} />
    </>
  );
}
