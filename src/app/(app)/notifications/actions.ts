"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/context";
import { notifications } from "@/db/schema";
import { formValues, type FormState } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/context";
import { saveOrgPrefs, saveUserSettings, sendAnnouncement } from "@/lib/workforce/communication";

export async function markReadAction(fd: FormData) {
  const ctx = await requireTenant();
  const id = String(fd.get("id") ?? "");
  await ctx.tx((tx) =>
    tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(id === "all" ? undefined : eq(notifications.id, id), eq(notifications.userId, ctx.user.id), isNull(notifications.readAt))),
  );
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}


export async function saveMyEmailPrefsAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireTenant();
  const r = await ctx.tx((tx) =>
    saveUserSettings(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, {
      emailAssignments: fd.get("emailAssignments") === "on",
      emailResults: fd.get("emailResults") === "on",
      emailAnnouncements: fd.get("emailAnnouncements") === "on",
      ...(fd.has("smsPhone") ? { smsOptIn: fd.get("smsOptIn") === "on", smsPhone: String(fd.get("smsPhone") ?? "") } : {}),
    }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/settings/notifications");
  return { ok: true, message: "Notification preferences saved." };
}

export async function saveOrgPrefsAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("org.settings.manage");
  const r = await ctx.tx((tx) =>
    saveOrgPrefs(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, {
      expiryLeadDays: String(fd.get("expiryLeadDays") ?? ""),
      emailEnabled: fd.get("emailEnabled") === "on",
      smsEnabled: fd.get("smsEnabled") === "on",
      escalateAfterDays: fd.get("escalateAfterDays"),
      renewalWindowDays: fd.get("renewalWindowDays"),
      defaultDueDays: fd.get("defaultDueDays"),
    }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/admin/notifications");
  return { ok: true, message: "Notification and renewal settings saved." };
}

export async function announceAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("notifications.announce");
  const s = (k: string) => String(fd.get(k) ?? "");
  const r = await ctx.tx((tx) =>
    sendAnnouncement(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, { title: s("title"), body: s("body"), audience: s("audience") || "all", facilityId: s("facilityId"), roleId: s("roleId") }),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/notifications");
  return { ok: true, message: `Announcement sent to ${r.data.recipients} member${r.data.recipients === 1 ? "" : "s"}.` };
}
