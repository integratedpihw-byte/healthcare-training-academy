import Link from "next/link";
import { authorRead, BUILDER_BASE } from "@/lib/learning/author-context";
import { listManagedCourses } from "@/lib/learning/builder";
import { Card, PageHeader } from "@/components/ui";
import { ManagedCourseList, NewCourseForm } from "@/components/builder/views";

export const metadata = { title: "Manage organization courses" };

export default async function Page() {
  const { data, can, categories } = await authorRead("tenant", (s) => listManagedCourses(s));
  return (
    <>
      <PageHeader title="Manage organization courses" description="Build courses specific to your organization. Every version passes editorial, clinical (when required) and compliance approval before learners see it." actions={<Link href="/catalog" className="text-sm font-semibold text-teal-700 hover:underline">← Catalog</Link>} />
      <div className="space-y-6">
        <Card title={`Courses (${data.length})`}><ManagedCourseList rows={data} base={BUILDER_BASE["tenant"]} /></Card>
        {can("courses.author") && (
          <Card title="Create a course"><NewCourseForm kind="tenant" categories={categories} /></Card>
        )}
      </div>
    </>
  );
}
