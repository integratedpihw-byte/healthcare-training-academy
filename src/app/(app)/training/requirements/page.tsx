import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/context";
import { listRequirements, SOURCE_LABELS } from "@/lib/workforce/requirements";
import { Alert, Badge, ButtonLink, Card, EmptyState, FACILITY_TYPE_LABELS, PageHeader, Table, Td } from "@/components/ui";
import { SubNav, TRAINING_TABS } from "@/components/workforce/common";
import { toggleRequirementAction } from "../actions";

export const metadata = { title: "Training requirements" };

const MSG: Record<string, string> = { created: "Requirement created. Re-evaluate requirements on employee profiles (or onboard new staff) to apply it.", updated: "Requirement saved.", toggled: "Requirement status changed." };

export default async function RequirementsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const ctx = await requireAnyPermission(["training.requirements.manage", "training.assign"]);
  const sp = await searchParams;
  const rows = await ctx.tx((tx) => listRequirements(tx));
  const canManage = ctx.can("training.requirements.manage");
  return (
    <>
      <PageHeader title="Training requirements & pathways" description="Your organization's rules for which employees must complete which courses and skills evaluations, and when. Onboarding applies them automatically by facility type, position and exposure." actions={canManage ? <ButtonLink href="/training/requirements/new" variant="teal">New requirement</ButtonLink> : undefined} />
      <SubNav items={TRAINING_TABS((x) => ctx.can(x as never))} active="/training/requirements" />
      {sp.msg && MSG[sp.msg] && <div className="mb-4"><Alert tone="green">{MSG[sp.msg]}</Alert></div>}
      <div className="mb-4"><Alert tone="blue">These are organizational policy and accreditation requirements you define. They are not legal determinations: Florida and federal regulatory requirements, with citations and verification status, are handled in the Compliance Center.</Alert></div>
      <Card>
        <Table head={["Requirement", "Applies to", "Schedule", "Status", ""]} empty={rows.length === 0 ? <EmptyState>No requirements yet.{canManage && <> <Link className="text-teal-700 underline" href="/training/requirements/new">Create the first one</Link>.</>}</EmptyState> : undefined}>
          {rows.map(({ r, courseTitle, courseStatus, competencyName }) => {
            const own = r.tenantId === ctx.tenant.id;
            return (
              <tr key={r.id}>
                <Td>
                  <div className="font-medium text-navy-900">{r.title ?? courseTitle ?? competencyName}</div>
                  <div className="text-xs text-slate-500">{r.courseId ? `Course: ${courseTitle}` : `Skills: ${competencyName}`} · {SOURCE_LABELS[r.source]}{!own && " · platform default"}</div>
                  {r.courseId && courseStatus !== "PUBLISHED" && <Badge tone="red">Course not published</Badge>}
                  {r.needsAdminReview && <Badge tone="amber">Review before assigning</Badge>}
                </Td>
                <Td className="text-xs">
                  <div>{r.facilityTypes.length ? r.facilityTypes.map((t) => FACILITY_TYPE_LABELS[t]).join(", ") : "All facility types"}</div>
                  <div>{r.positionCodes.length ? r.positionCodes.join(", ") : "All positions"}</div>
                  {(r.requiresClinicalExposure || r.requiresBloodborneExposure) && <div>{[r.requiresClinicalExposure && "Clinical exposure", r.requiresBloodborneExposure && "Bloodborne exposure"].filter(Boolean).join(" + ")}</div>}
                </Td>
                <Td className="text-xs">
                  <div>{r.dueWithinDaysOfHire != null ? `Due ${r.dueWithinDaysOfHire} days after hire` : "Default due window"}</div>
                  {r.frequencyMonths && <div>Repeats every {r.frequencyMonths} months</div>}
                  {r.reminderLeadDays?.length ? <div>Reminders: {r.reminderLeadDays.join("/")} days</div> : null}
                </Td>
                <Td>{r.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</Td>
                <Td className="whitespace-nowrap text-right">
                  {canManage && own && (
                    <>
                      <Link href={`/training/requirements/${r.id}`} className="mr-3 text-sm font-semibold text-teal-700 hover:underline">Edit</Link>
                      <form action={toggleRequirementAction} className="inline"><input type="hidden" name="requirementId" value={r.id} /><input type="hidden" name="active" value={String(!r.isActive)} /><button type="submit" className="text-sm text-slate-600 hover:underline">{r.isActive ? "Deactivate" : "Activate"}</button></form>
                    </>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
