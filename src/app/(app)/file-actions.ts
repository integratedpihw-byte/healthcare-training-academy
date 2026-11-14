"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/context";
import { removeFile } from "@/lib/files/service";

/** Soft-removes an attached file (RLS + trigger decide whether this user may). */
export async function removeFileAction(fd: FormData): Promise<void> {
  const ctx = await requireTenant();
  const id = fd.get("fileId");
  const back = String(fd.get("back") ?? "");
  if (typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) await ctx.tx((tx) => removeFile(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id }, id));
  if (back.startsWith("/") && !back.startsWith("//")) revalidatePath(back);
}
