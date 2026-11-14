"use server";
import { planLimitCheck } from "@/lib/billing/limits";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePermission } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import { addEmployeeFacility, createEmployee, provisionEmployeeAccount, removeEmployeeFacility, updateEmployee } from "@/lib/workforce/employees";
import { deleteLicense, saveLicense, verifyLicense } from "@/lib/workforce/licenses";
import { runOnboarding } from "@/lib/workforce/onboarding";

function employeeInput(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? "");
  return {
    employeeNumber: s("employeeNumber"),
    firstName: s("firstName"),
    lastName: s("lastName"),
    email: s("email"),
    phone: s("phone"),
    jobTitle: s("jobTitle"),
    positionCode: s("positionCode"),
    clinicalExposure: fd.get("clinicalExposure") === "on",
    bloodborneExposure: fd.get("bloodborneExposure") === "on",
    employmentStatus: s("employmentStatus") || "ACTIVE",
    hireDate: s("hireDate"),
    terminationDate: s("terminationDate"),
    primaryFacilityId: s("primaryFacilityId"),
    departmentId: s("departmentId"),
    supervisorId: s("supervisorId"),
    trainingPathway: s("trainingPathway"),
    jobDuties: fd.getAll("jobDuties").map(String),
  };
}

function svcCtx(ctx: Awaited<ReturnType<typeof requirePermission>>) {
  return { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access };
}

export async function createEmployeeAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const limit = await ctx.tx((tx) => planLimitCheck(tx, ctx.entitlements, "employee"));
  if (limit) return { error: limit, values: formValues(fd) };
  const c = svcCtx(ctx);
  const onboard = fd.get("runOnboarding") === "on" && ctx.can("training.assign");
  const provision = fd.get("provisionAccount") === "on";
  const r = await ctx.tx(async (tx) => {
    const created = await createEmployee(tx, c, employeeInput(fd));
    if (!created.ok) return created;
    // Account first so the onboarding notification reaches the employee (step 7).
    if (provision) {
      const p = await provisionEmployeeAccount(systemDb(), tx, c, created.data.id);
      if (!p.ok) return p;
    }
    if (onboard) {
      const o = await runOnboarding(tx, c, created.data.id);
      if (!o.ok) return o;
    }
    return created;
  });
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/employees");
  redirect(`/employees/${r.data.id}?msg=created`);
}

export async function updateEmployeeAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const r = await ctx.tx((tx) => updateEmployee(tx, svcCtx(ctx), id, employeeInput(fd)));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}?msg=${r.data.facilityOrPositionChanged ? "updated-reevaluate" : "updated"}`);
}

export async function runOnboardingAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.assign");
  const id = String(fd.get("employeeId") ?? "");
  const r = await ctx.tx((tx) => runOnboarding(tx, svcCtx(ctx), id));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/employees/${id}`);
  return { ok: true, message: `Requirements evaluated: ${r.data.results.length} apply, ${r.data.assigned} newly assigned.` };
}

export async function provisionAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const r = await ctx.tx((tx) => provisionEmployeeAccount(systemDb(), tx, svcCtx(ctx), id));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/employees/${id}`);
  return { ok: true, message: r.data.created ? "Account created. A set-password email has been sent." : "Existing account linked and given learner access." };
}

export async function addFacilityAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const r = await ctx.tx((tx) => addEmployeeFacility(tx, svcCtx(ctx), id, String(fd.get("facilityId") ?? "")));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/employees/${id}`);
  return { ok: true, message: "Facility assignment added. Re-evaluate requirements to apply facility-specific training." };
}

export async function removeFacilityAction(fd: FormData) {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const r = await ctx.tx((tx) => removeEmployeeFacility(tx, svcCtx(ctx), id, String(fd.get("facilityId") ?? "")));
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}?msg=${r.ok ? "facility-removed" : "facility-remove-failed"}`);
}

export async function saveLicenseAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const licenseId = String(fd.get("licenseId") ?? "") || undefined;
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await ctx.tx((tx) =>
    saveLicense(tx, svcCtx(ctx), id, { kind: s("kind"), name: s("name"), licenseNumber: s("licenseNumber"), issuingAuthority: s("issuingAuthority"), state: s("state"), issuedOn: s("issuedOn"), expiresOn: s("expiresOn"), notes: s("notes") }, licenseId),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath(`/employees/${id}`);
  if (licenseId) redirect(`/employees/${id}?msg=license-saved#licenses`);
  return { ok: true, message: "License recorded (unverified until checked against the issuing authority)." };
}

export async function verifyLicenseAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  const decision = fd.get("decision") === "REJECTED" ? "REJECTED" : "VERIFIED";
  const r = await ctx.tx((tx) => verifyLicense(tx, svcCtx(ctx), String(fd.get("licenseId") ?? ""), decision, String(fd.get("source") ?? "")));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}?msg=license-${decision.toLowerCase()}#licenses`);
}

export async function deleteLicenseAction(fd: FormData) {
  const ctx = await requirePermission("employees.manage");
  const id = String(fd.get("employeeId") ?? "");
  await ctx.tx((tx) => deleteLicense(tx, svcCtx(ctx), String(fd.get("licenseId") ?? "")));
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}?msg=license-removed#licenses`);
}
