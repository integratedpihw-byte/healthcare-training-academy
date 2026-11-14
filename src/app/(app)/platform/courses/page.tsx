import Link from "next/link";
import { authorRead, BUILDER_BASE } from "@/lib/learning/author-context";
import { listManagedCourses } from "@/lib/learning/builder";
import { Card, PageHeader } from "@/components/ui";
import { ManagedCourseList, NewCourseForm } from "@/components/builder/views";

export const metadata = { title: "Master course library" };

export default async function Page() {
  const { data, can, categories } = await authorRead("platform", (s) => listManagedCourses(s));
  return (
    <>
      <PageHeader title="Master course library" description="Platform-wide courses available to every organization. Library content requires qualified review before publication." actions={<Link href="/platform" className="text-sm font-semibold text-teal-700 hover:underline">← Platform Console</Link>} />
      <div className="space-y-6">
        <Card title={`Courses (${data.length})`}><ManagedCourseList rows={data} base={BUILDER_BASE["platform"]} /></Card>
        {can("courses.author") && (
          <Card title="Create a course"><NewCourseForm kind="platform" categories={categories} /></Card>
        )}
      </div>
    </>
  );
}
