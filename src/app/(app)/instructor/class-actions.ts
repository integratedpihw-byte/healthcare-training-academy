"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyPermission, requirePermission, requireTenant, type TenantContext } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import * as svc from "@/lib/instructors/service";
import { systemDb } from "@/db/server";
import { issueInstructorCertificate } from "@/lib/certificates/service";
import { setRate } from "@/lib/instructors/compensation";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
const c = (ctx: TenantContext) => ({ tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access });
const obj = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")));

export async function createSessionAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.schedule.manage");
  const r = await ctx.tx((tx) => svc.createSession(tx, c(ctx), obj(fd)));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  redirect(`/instructor/classes/${r.data.id}`);
}

export async function registerAttendeesAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("training.schedule.manage");
  const id = fd.get("sessionId");
  const users = fd.getAll("userId").filter(isUuid);
  if (!isUuid(id) || !users.length) return { error: "Choose at least one attendee." };
  const r = await ctx.tx((tx) => svc.registerAttendees(tx, c(ctx), id, users));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/instructor/classes/${id}`);
  return { ok: true, message: `${r.data.added} registered${r.data.skipped ? `, ${r.data.skipped} already on the roster` : ""}. Attendees were notified.` };
}

export async function attendanceAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireTenant();
  const id = fd.get("sessionId");
  if (!isUuid(id)) return { error: "Invalid request." };
  const marks: Record<string, "PRESENT" | "ABSENT" | "EXCUSED"> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("mark:") && isUuid(k.slice(5)) && (v === "PRESENT" || v === "ABSENT" || v === "EXCUSED")) marks[k.slice(5)] = v;
  }
  if (!Object.keys(marks).length) return { error: "Mark at least one attendee." };
  const r = await ctx.tx((tx) => svc.recordAttendance(tx, c(ctx), id, marks));
  if (!r.ok) return { error: r.error };
  revalidatePath(`/instructor/classes/${id}`);
  return { ok: true, message: `Attendance saved for ${r.data.recorded} attendee(s).` };
}

export async function sessionStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireTenant();
  const id = fd.get("sessionId");
  const status = fd.get("status");
  if (!isUuid(id) || (status !== "COMPLETED" && status !== "CANCELLED")) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => svc.setSessionStatus(tx, c(ctx), id, status, String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error, values: formValues(fd) };
  revalidatePath(`/instructor/classes/${id}`);
  return { ok: true, message: status === "CANCELLED" ? "Class cancelled; registered attendees were notified." : "Class marked completed." };
}

export async function messageAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireAnyPermission(["training.schedule.manage", "assessments.grade", "instructors.manage"]);
  const r = await ctx.tx((tx) => svc.sendInstructorMessage(tx, c(ctx), obj(fd)));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  return { ok: true, message: `Message sent to ${r.data.recipients} learner(s).` };
}

export async function selfRegisterAction(fd: FormData): Promise<void> {
  const ctx = await requirePermission("learning.self");
  const id = fd.get("sessionId");
  if (!isUuid(id)) redirect("/learning");
  const r = await ctx.tx((tx) => svc.selfRegister(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id));
  revalidatePath("/learning");
  redirect(r.ok ? "/learning?registered=1" : `/learning?classError=${encodeURIComponent(r.error)}`);
}

// --- Instructor profiles ----------------------------------------------------

export async function saveProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireTenant();
  const id = fd.get("instructorId");
  const r = await ctx.tx((tx) => svc.saveProfile(tx, c(ctx), obj(fd), isUuid(id) ? id : undefined));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/instructor/instructors");
  return { ok: true, message: "Profile saved." };
}

export async function addInstructorAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("instructors.manage");
  const u = fd.get("userId");
  if (!isUuid(u)) return { error: "Choose a member." };
  const title = String(fd.get("title") ?? "").trim().slice(0, 120) || null;
  const r = await ctx.tx((tx) => svc.addInstructor(tx, c(ctx), u, title));
  if (!r.ok) return { error: r.error };
  revalidatePath("/instructor/instructors");
  return { ok: true, message: "Instructor added." };
}

export async function instructorActiveAction(fd: FormData): Promise<void> {
  const ctx = await requirePermission("instructors.manage");
  const id = fd.get("instructorId");
  if (isUuid(id)) await ctx.tx((tx) => svc.setInstructorActive(tx, c(ctx), id, fd.get("active") === "1"));
  revalidatePath("/instructor/instructors");
}

export async function assignCourseAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("instructors.manage");
  const i = fd.get("instructorId");
  const co = fd.get("courseId");
  if (!isUuid(i) || !isUuid(co)) return { error: "Choose a course." };
  const r = await ctx.tx((tx) => svc.assignCourse(tx, c(ctx), i, co));
  if (!r.ok) return { error: r.error };
  revalidatePath("/instructor/instructors");
  return { ok: true, message: "Course assigned." };
}

export async function unassignCourseAction(fd: FormData): Promise<void> {
  const ctx = await requirePermission("instructors.manage");
  const i = fd.get("instructorId");
  const co = fd.get("courseId");
  if (isUuid(i) && isUuid(co)) await ctx.tx((tx) => svc.unassignCourse(tx, c(ctx), i, co));
  revalidatePath("/instructor/instructors");
}

export async function issueInstructorCertificateAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("certificates.issue");
  const i = fd.get("instructorId");
  const co = fd.get("courseId");
  if (!isUuid(i) || !isUuid(co)) return { error: "Choose a course." };
  const r = await issueInstructorCertificate(systemDb(), { tenantId: ctx.tenant.id, userId: ctx.user.id }, { instructorId: i, courseId: co, hours: Number(fd.get("hours") ?? 0), note: String(fd.get("note") ?? "") });
  if (!r.ok) return { error: r.error };
  revalidatePath("/instructor/instructors");
  revalidatePath("/certificates");
  return { ok: true, message: "Instructor certificate issued. The instructor was notified." };
}

export async function setRateAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("instructors.manage");
  const r = await ctx.tx((tx) => setRate(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, obj(fd)));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/instructor/instructors");
  return { ok: true, message: "Rate saved. It applies to classes on or after the effective date." };
}
