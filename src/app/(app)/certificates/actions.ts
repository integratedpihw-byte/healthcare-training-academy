"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePermission } from "@/lib/auth/context";
import { correctCertificate, revokeCertificate } from "@/lib/certificates/service";
import { notify } from "@/lib/notify/notifications";
import type { FormState } from "@/lib/forms";

export async function revokeAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("certificates.revoke");
  const id = String(fd.get("certificateId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid request." };
  const r = await ctx.tx((tx) => revokeCertificate(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id, String(fd.get("reason") ?? "")));
  if (!r.ok) return { error: r.error };
  await notify(systemDb(), { tenantId: ctx.tenant.id, userId: r.data.userId, type: "certificate.revoked", title: "A certificate was revoked", body: `Your certificate for ${r.data.courseTitle} was revoked by your organization. Contact your administrator for details.`, link: `/certificates/${id}`, dedupeKey: `revoked:${id}` });
  revalidatePath("/certificates");
  redirect(`/certificates/${id}?revoked=1`);
}

export async function correctAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePermission("certificates.revoke");
  const id = String(fd.get("certificateId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid request." };
  const r = await ctx.tx((tx) =>
    correctCertificate(systemDb(), tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id, { recipientName: String(fd.get("recipientName") ?? ""), reason: String(fd.get("reason") ?? "") }),
  );
  if (!r.ok) return { error: r.error };
  revalidatePath("/certificates");
  redirect(`/certificates/${r.data.id}?corrected=1`);
}
