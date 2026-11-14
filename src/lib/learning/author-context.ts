import "server-only";
import { redirect } from "next/navigation";
import { isNull } from "drizzle-orm";
import { systemDb, type Tx, type Db } from "@/db/server";
import { courseCategories } from "@/db/schema";
import { requirePlatformAdmin, requireTenant, requireFeature } from "@/lib/auth/context";
import type { AuthorScope } from "./builder";
import { listCategories } from "./builder";
import type { PermissionKey } from "@/lib/rbac/catalog";

export type Kind = "tenant" | "platform";
export const BUILDER_BASE: Record<Kind, string> = { tenant: "/catalog/manage", platform: "/platform/courses" };
const AUTHORING: PermissionKey[] = ["courses.author", "courses.review", "courses.approve.clinical", "courses.approve.compliance", "courses.publish"];

/** Runs a read-only builder query in the right scope and returns the permission checker. */
export async function authorRead<T>(kind: Kind, fn: (s: AuthorScope, db: Db | Tx) => Promise<T>): Promise<{ data: T; can: (p: PermissionKey) => boolean; categories: Awaited<ReturnType<typeof listCategories>> }> {
  if (kind === "platform") {
    const ctx = await requirePlatformAdmin();
    const db = systemDb();
    const s: AuthorScope = { db, tenantId: null, userId: ctx.user.id, can: () => true };
    return { data: await fn(s, db), can: () => true, categories: await db.select().from(courseCategories).where(isNull(courseCategories.tenantId)) };
  }
  const ctx = await requireTenant();
  if (!AUTHORING.some((p) => ctx.can(p))) redirect("/forbidden?p=courses.author");
  requireFeature(ctx, "customCourses");
  return ctx.tx(async (tx) => {
    const s: AuthorScope = { db: tx, tenantId: ctx.tenant.id, userId: ctx.user.id, can: ctx.can };
    return { data: await fn(s, tx), can: ctx.can, categories: await listCategories(tx) };
  });
}
