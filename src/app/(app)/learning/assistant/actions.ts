"use server";

import { requireFeature, requireTenant } from "@/lib/auth/context";
import { runAssistant, type AssistantResult } from "@/lib/ai/service";

export type AssistantState = (AssistantResult & { input?: string; mode?: string }) | undefined;

export async function assistantAction(_: AssistantState, fd: FormData): Promise<AssistantState> {
  const ctx = await requireTenant();
  requireFeature(ctx, "aiAssistant");
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
  const r = await ctx.tx((tx) => runAssistant(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id, access: ctx.access }, raw));
  return { ...r, input: String(raw.input ?? ""), mode: String(raw.mode ?? "") };
}
