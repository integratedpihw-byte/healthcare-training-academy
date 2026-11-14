import { notFound } from "next/navigation";
import { authorRead, BUILDER_BASE } from "@/lib/learning/author-context";
import { getBuilderLesson } from "@/lib/learning/builder";
import { PageHeader } from "@/components/ui";
import { LessonEditor } from "@/components/builder/views";

export const metadata = { title: "Lesson editor" };

export default async function Page({ params, searchParams }: { params: Promise<{ courseId: string; lessonId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { lessonId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) notFound();
  const { data: row, can } = await authorRead("platform", (s) => getBuilderLesson(s, lessonId));
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.lesson.title} description={`${row.course.title} · ${row.module.title} · version ${row.version.versionNumber}`} />
      <LessonEditor row={row} kind="platform" base={BUILDER_BASE["platform"]} canAuthor={can("courses.author")} saved={!!(await searchParams).saved} />
    </>
  );
}
