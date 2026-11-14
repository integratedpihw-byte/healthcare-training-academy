import { requirePermission } from "@/lib/auth/context";
import { assignableCourses } from "@/lib/workforce/assignments";
import { listCompetencies } from "@/lib/competency/service";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { RequirementFields } from "@/components/workforce/requirement-fields";
import { saveRequirementAction } from "../../actions";

export const metadata = { title: "New training requirement" };

export default async function NewRequirementPage() {
  const ctx = await requirePermission("training.requirements.manage");
  const d = await ctx.tx(async (tx) => ({ courses: await assignableCourses(tx), comps: await listCompetencies(tx) }));
  return (
    <>
      <PageHeader title="New training requirement" actions={<ButtonLink href="/training/requirements" variant="secondary">Cancel</ButtonLink>} />
      <Card>
        <ActionForm action={saveRequirementAction} submitLabel="Create requirement" className="space-y-6">
          <RequirementFields courses={d.courses} competencies={d.comps.map((c) => ({ id: c.id, name: c.name }))} />
        </ActionForm>
      </Card>
    </>
  );
}
