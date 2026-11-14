"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import { bulkAssign, changeDueDate, closeAssignment } from "@/lib/workforce/assignments";
import { saveRequirement, setRequirementActive } from "@/lib/workforce/requirements";

type Ctx = Awaited<ReturnType<typeof requirePermission>>;
const svc = (ctx: Ctx) => ({ tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access });

export async function bulkAssignAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.assign");
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await ctx.tx((tx) =>
    bulkAssign(tx, svc(ctx), {
      courseId: s("courseId"),
      mode: s("mode") || "employees",
      employeeIds: fd.getAll("employeeIds").map(String).filter(Boolean),
      facilityId: s("facilityId"),
      positionCode: s("positionCode"),
      departmentId: s("departmentId"),
      dueDate: s("dueDate"),
      reason: s("reason"),
    }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/training");
  const { created, skipped, denied } = r.data;
  const parts = [`${created.length} assignment${created.length === 1 ? "" : "s"} created`];
  if (skipped.length) parts.push(`${skipped.length} skipped (already assigned or terminated)`);
  if (denied.length) parts.push(`${denied.length} outside your facilities`);
  return { ok: created.length > 0, message: `${parts.join(", ")}.`, error: created.length ? undefined : `${parts.join(", ")}.` };
}

export async function closeAssignmentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.assign");
  const id = String(fd.get("assignmentId") ?? "");
  const status = fd.get("status") === "WAIVED" ? "WAIVED" : "CANCELLED";
  const r = await ctx.tx((tx) => closeAssignment(tx, svc(ctx), id, status, String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/training/assignments/${id}`);
  redirect(`/training/assignments/${id}?msg=${status.toLowerCase()}`);
}

export async function changeDueDateAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.assign");
  const id = String(fd.get("assignmentId") ?? "");
  const r = await ctx.tx((tx) => changeDueDate(tx, svc(ctx), id, String(fd.get("dueDate") ?? ""), String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/training/assignments/${id}`);
  redirect(`/training/assignments/${id}?msg=rescheduled`);
}

export async function saveRequirementAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.requirements.manage");
  const id = String(fd.get("requirementId") ?? "") || undefined;
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await ctx.tx((tx) =>
    saveRequirement(
      tx,
      svc(ctx),
      {
        title: s("title"),
        target: s("target") || "course",
        courseId: s("courseId"),
        competencyId: s("competencyId"),
        source: s("source") || "ORGANIZATIONAL_POLICY",
        facilityTypes: fd.getAll("facilityTypes").map(String),
        positionCodes: s("positionCodes"),
        requiresClinicalExposure: fd.get("requiresClinicalExposure") === "on",
        requiresBloodborneExposure: fd.get("requiresBloodborneExposure") === "on",
        dueWithinDaysOfHire: s("dueWithinDaysOfHire"),
        frequencyMonths: s("frequencyMonths"),
        reminderLeadDays: s("reminderLeadDays"),
        needsAdminReview: fd.get("needsAdminReview") === "on",
        notes: s("notes"),
      },
      id,
    ),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/training/requirements");
  redirect(`/training/requirements?msg=${id ? "updated" : "created"}`);
}

export async function toggleRequirementAction(fd: FormData) {
  const ctx = await requirePermission("training.requirements.manage");
  await ctx.tx((tx) => setRequirementActive(tx, svc(ctx), String(fd.get("requirementId") ?? ""), fd.get("active") === "true"));
  revalidatePath("/training/requirements");
  redirect("/training/requirements?msg=toggled");
}
