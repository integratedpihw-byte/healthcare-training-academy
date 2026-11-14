"use server";

import { revalidatePath } from "next/cache";
import { requireFeature, requirePermission } from "@/lib/auth/context";
import { formValues, type FormState } from "@/lib/forms";
import { createApiKey, revokeApiKey } from "@/lib/integrations/api-keys";

export async function createKeyAction(_: FormState, fd: FormData): Promise<FormState & { secret?: string }> {
  const ctx = await requirePermission("integrations.manage");
  requireFeature(ctx, "apiIntegrations");
  const r = await ctx.tx((tx) => createApiKey(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, { name: fd.get("name"), scopes: fd.getAll("scopes"), expiresInDays: fd.get("expiresInDays") }));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  revalidatePath("/admin/integrations");
  return { ok: true, secret: r.data.secret };
}

export async function revokeKeyAction(fd: FormData): Promise<void> {
  const ctx = await requirePermission("integrations.manage");
  const id = fd.get("id");
  if (typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) await ctx.tx((tx) => revokeApiKey(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id));
  revalidatePath("/admin/integrations");
}
