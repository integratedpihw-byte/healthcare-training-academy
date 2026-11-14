import { and, count, eq, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth/context";
import { withTenant } from "@/db/server";
import { notifications } from "@/db/schema";
import { can } from "@/lib/rbac/access";
import { NAV, visibleNav } from "@/lib/nav";
import { hasFeature } from "@/lib/billing/plans";
import { AppShell } from "@/components/app-shell";
import { DemoBanner } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireUser();
  const activeTenant = ctx.tenant?.status === "ACTIVE" ? ctx.tenant : null;
  const nav = activeTenant ? visibleNav((p) => can(ctx.access, p), (f) => (ctx.entitlements ? hasFeature(ctx.entitlements, f) : false)) : NAV.filter((n) => n.key === "settings");
  let unread = 0;
  if (activeTenant) {
    unread = await withTenant({ tenantId: activeTenant.id, userId: ctx.user.id }, async (tx) => {
      const [r] = await tx
        .select({ n: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), isNull(notifications.readAt)));
      return r.n;
    });
  }
  return (
    <AppShell
      nav={nav}
      user={ctx.user}
      tenantName={activeTenant?.name ?? null}
      roleNames={ctx.access?.roles.map((r) => r.name) ?? []}
      isPlatformAdmin={ctx.user.isPlatformAdmin}
      unread={unread}
      banner={<DemoBanner show={!!activeTenant?.name.endsWith("(DEMO)")} />}
    >
      {children}
    </AppShell>
  );
}
