import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { assignableCourses } from "@/lib/workforce/assignments";
import { listCompetencies } from "@/lib/competency/service";
import { getRequirement } from "@/lib/workforce/requirements";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { RequirementFields } from "@/components/workforce/requirement-fields";
import { saveRequirementAction } from "../../actions";

export const metadata = { title: "Edit training requirement" };

export default async function EditRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePermission("training.requirements.manage");
  const d = await ctx.tx(async (tx) => ({ r: await getRequirement(tx, id), courses: await assignableCourses(tx), comps: await listCompetencies(tx) }));
  if (!d.r || d.r.tenantId !== ctx.tenant.id) notFound();
  return (
    <>
      <PageHeader title="Edit training requirement" description="Changes apply to future onboarding and re-evaluations; existing assignments are not changed." actions={<ButtonLink href="/training/requirements" variant="secondary">Cancel</ButtonLink>} />
      <Card>
        <ActionForm action={saveRequirementAction} submitLabel="Save requirement" className="space-y-6">
          <input type="hidden" name="requirementId" value={id} />
          <RequirementFields d={d.r} courses={d.courses} competencies={d.comps.map((c) => ({ id: c.id, name: c.name }))} />
        </ActionForm>
      </Card>
    </>
  );
}
