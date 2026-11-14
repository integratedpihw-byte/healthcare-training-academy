import Link from "next/link";
import { eq } from "drizzle-orm";
import { requirePermission, requireFeature } from "@/lib/auth/context";
import { evaluableEmployees, listCompetencies, type Criterion } from "@/lib/competency/service";
import { facilities } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { EvaluationForm } from "@/components/competency/evaluation-form";

export const metadata = { title: "New skills evaluation" };

export default async function NewEvaluationPage({ searchParams }: { searchParams: Promise<{ employee?: string }> }) {
  const ctx = await requirePermission("competency.evaluate");
  requireFeature(ctx, "competency");
  const d = await ctx.tx(async (tx) => ({
    emps: (await evaluableEmployees(tx, ctx.access)).filter((e) => e.userId !== ctx.user.id),
    facs: await tx.select({ id: facilities.id, name: facilities.name }).from(facilities).where(eq(facilities.isActive, true)),
    comps: await listCompetencies(tx),
  }));
  return (
    <>
      <PageHeader title="New skills evaluation" description="Record what you directly observed, criterion by criterion. Evaluate only skills within the employee's authorized scope of practice." actions={<Link href="/competency" className="text-sm font-semibold text-teal-700 hover:underline">← Competency Management</Link>} />
      <Card>
        <EvaluationForm
          employees={d.emps.map((e) => ({ id: e.id, name: e.name, jobTitle: e.jobTitle, facilityIds: e.facilityIds }))}
          facilities={d.facs.filter((f) => ctx.can("competency.evaluate", f.id))}
          competencies={d.comps.map((c) => ({ id: c.id, name: c.name, description: c.description, criteria: c.criteria as Criterion[] }))}
          defaultEmployeeId={(await searchParams).employee}
        />
      </Card>
    </>
  );
}
