/**
 * Notification preferences and administrator announcements (spec §18).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { announcements, facilities, membershipRoles, memberships, notificationPreferences, roles, userNotificationSettings } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify/notifications";
import { normalizePhone } from "@/lib/notify/sms";
import { can } from "@/lib/rbac/access";
import type { ServiceResult } from "@/lib/tenancy/service";
import type { Ctx } from "./employees";
import { DEFAULT_LEAD_DAYS, parseLeadDays } from "./rules";

const err = (error: string, fieldErrors?: Record<string, string[]>): ServiceResult<never> => ({ ok: false, error, fieldErrors });

// ---------------------------------------------------------------------------
// Organization settings (org.settings.manage)
// ---------------------------------------------------------------------------

export const orgPrefsSchema = z.object({
  expiryLeadDays: z.string().refine((s) => parseLeadDays(s) !== null, "Use whole days between 1 and 365, e.g. 90, 60, 30, 15, 7"),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean().default(false),
  escalateAfterDays: z.coerce.number().int().min(1, "At least 1 day").max(90),
  renewalWindowDays: z.coerce.number().int().min(7, "At least 7 days").max(365),
  defaultDueDays: z.coerce.number().int().min(1, "At least 1 day").max(365),
});

export async function getOrgPrefs(tx: Tx) {
  const [p] = await tx.select().from(notificationPreferences).limit(1);
  return p ?? { expiryLeadDays: DEFAULT_LEAD_DAYS, emailEnabled: true, smsEnabled: false, escalateAfterDays: 7, renewalWindowDays: 60, defaultDueDays: 30 };
}

export async function saveOrgPrefs(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<null>> {
  const p = orgPrefsSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const values = { ...p.data, expiryLeadDays: parseLeadDays(p.data.expiryLeadDays)! };
  try {
    const before = await getOrgPrefs(tx);
    await tx
      .insert(notificationPreferences)
      .values({ tenantId: ctx.tenantId, ...values })
      .onConflictDoUpdate({ target: notificationPreferences.tenantId, set: values });
    await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "settings.notifications_updated", entityType: "notification_preferences", entityId: ctx.tenantId, before, after: values });
  } catch {
    return err("You are not authorized to change organization settings.");
  }
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Personal email preferences (every member)
// ---------------------------------------------------------------------------

export async function getUserSettings(tx: Tx, userId: string) {
  const [s] = await tx.select().from(userNotificationSettings).where(eq(userNotificationSettings.userId, userId));
  return s ?? { emailAssignments: true, emailResults: true, emailAnnouncements: true, smsOptIn: false, smsPhone: null, smsConsentAt: null };
}

export async function saveUserSettings(
  tx: Tx,
  ctx: { tenantId: string; userId: string },
  v: { emailAssignments: boolean; emailResults: boolean; emailAnnouncements: boolean; smsOptIn?: boolean; smsPhone?: string },
): Promise<ServiceResult<null>> {
  const { smsOptIn, smsPhone, ...email } = v;
  let sms: { smsOptIn: boolean; smsPhone: string | null; smsConsentAt: Date | null } | Record<string, never> = {};
  if (smsOptIn !== undefined) {
    const phone = smsPhone?.trim() ? normalizePhone(smsPhone) : null;
    if (smsPhone?.trim() && !phone) return err("Enter a valid mobile number, e.g. (813) 555-0142 or +18135550142.", { smsPhone: ["Invalid phone number"] });
    if (smsOptIn && !phone) return err("Enter your mobile number to receive text alerts.", { smsPhone: ["Required for text alerts"] });
    const before = await getUserSettings(tx, ctx.userId);
    sms = { smsOptIn, smsPhone: phone, smsConsentAt: smsOptIn ? (before.smsOptIn && before.smsPhone === phone ? before.smsConsentAt : new Date()) : null };
  }
  const values = { ...email, ...sms };
  await tx
    .insert(userNotificationSettings)
    .values({ tenantId: ctx.tenantId, userId: ctx.userId, ...values })
    .onConflictDoUpdate({ target: [userNotificationSettings.tenantId, userNotificationSettings.userId], set: values });
  if (smsOptIn !== undefined) await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: smsOptIn ? "sms.opted_in" : "sms.opted_out", entityType: "user", entityId: ctx.userId });
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Announcements (notifications.announce)
// ---------------------------------------------------------------------------

export const announcementSchema = z
  .object({
    title: z.string().trim().min(3, "Required").max(120),
    body: z.string().trim().min(3, "Required").max(2000),
    audience: z.enum(["all", "facility", "role"]),
    facilityId: z.string().uuid().optional().or(z.literal("")),
    roleId: z.string().uuid().optional().or(z.literal("")),
  })
  .superRefine((v, c) => {
    if (v.audience === "facility" && !v.facilityId) c.addIssue({ code: "custom", path: ["facilityId"], message: "Choose a facility" });
    if (v.audience === "role" && !v.roleId) c.addIssue({ code: "custom", path: ["roleId"], message: "Choose a role" });
  });

/**
 * Facility audience = members whose employee record is assigned to the facility plus
 * members holding a role scoped to it. Facility-scoped announcers may only address
 * their own facilities. Bodies must not contain PHI.
 */
export async function sendAnnouncement(tx: Tx, ctx: Ctx, raw: unknown): Promise<ServiceResult<{ id: string; recipients: number }>> {
  const p = announcementSchema.safeParse(raw);
  if (!p.success) return err("Please correct the highlighted fields.", p.error.flatten().fieldErrors as Record<string, string[]>);
  const v = p.data;
  if (v.audience !== "facility" && !can(ctx.access, "notifications.announce", null)) return err("You may only send announcements to your facility.");
  if (v.audience === "facility" && !can(ctx.access, "notifications.announce", v.facilityId)) return err("You are not authorized to address that facility.");

  let recipients: string[];
  if (v.audience === "all") {
    recipients = (await tx.select({ u: memberships.userId }).from(memberships).where(eq(memberships.status, "ACTIVE"))).map((r) => r.u);
  } else if (v.audience === "role") {
    const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.id, v.roleId!));
    if (!role) return err("Role not found.");
    recipients = (
      await tx
        .selectDistinct({ u: memberships.userId })
        .from(membershipRoles)
        .innerJoin(memberships, eq(memberships.id, membershipRoles.membershipId))
        .where(and(eq(membershipRoles.roleId, role.id), eq(memberships.status, "ACTIVE")))
    ).map((r) => r.u);
  } else {
    const [f] = await tx.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, v.facilityId!));
    if (!f) return err("Facility not found.");
    const r = await tx.execute<{ user_id: string }>(sql`
      select m.user_id from memberships m where m.status = 'ACTIVE' and (
        exists (select 1 from membership_roles mr where mr.membership_id = m.id and mr.facility_id = ${f.id}::uuid)
        or m.user_id in (select e.user_id from employees e join employee_facilities ef on ef.employee_id = e.id
                          where ef.facility_id = ${f.id}::uuid and e.user_id is not null and e.employment_status <> 'TERMINATED'))`);
    recipients = r.rows.map((x) => x.user_id);
  }
  recipients = [...new Set(recipients)].filter((u) => u !== ctx.userId);
  if (!recipients.length) return err("No members match that audience.");

  const audience = { kind: v.audience, facilityId: v.facilityId || null, roleId: v.roleId || null };
  const [row] = await tx.insert(announcements).values({ tenantId: ctx.tenantId, authorId: ctx.userId, title: v.title, body: v.body, audience, recipientCount: recipients.length }).returning({ id: announcements.id });
  for (let i = 0; i < recipients.length; i += 200) {
    await notify(
      tx,
      recipients.slice(i, i + 200).map((u) => ({ tenantId: ctx.tenantId, userId: u, type: "announcement", title: v.title, body: v.body, link: "/notifications", dedupeKey: `ann:${row.id}:${u}` })),
    );
  }
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "announcement.sent", entityType: "announcement", entityId: row.id, after: { title: v.title, audience, recipients: recipients.length } });
  return { ok: true, data: { id: row.id, recipients: recipients.length } };
}

export async function listAnnouncements(tx: Tx, limit = 20) {
  return tx.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit);
}

export async function announcementOptions(tx: Tx) {
  const facs = await tx.select({ id: facilities.id, name: facilities.name }).from(facilities).where(eq(facilities.isActive, true));
  const rs = await tx.select({ id: roles.id, name: roles.name }).from(roles);
  return { facilities: facs, roles: rs };
}

