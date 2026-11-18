import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { Bell, Building2, CreditCard, LayoutDashboard, LogOut, Settings, ShieldCheck, BookOpen, GraduationCap, ClipboardList, Users, BadgeCheck, Award, Scale, Presentation, BarChart3 } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Logo } from "./ui";
import { NavLink } from "./nav-link";
import type { NavItem } from "@/lib/nav";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  catalog: BookOpen,
  learning: GraduationCap,
  training: ClipboardList,
  employees: Users,
  competency: BadgeCheck,
  certificates: Award,
  compliance: Scale,
  instructor: Presentation,
  reports: BarChart3,
  notifications: Bell,
  billing: CreditCard,
  admin: Building2,
  settings: Settings,
};

export function AppShell({
  nav,
  user,
  tenantName,
  roleNames,
  isPlatformAdmin,
  unread,
  children,
  banner,
}: {
  nav: NavItem[];
  user: { firstName: string; lastName: string; email: string };
  tenantName: string | null;
  roleNames: string[];
  isPlatformAdmin: boolean;
  unread: number;
  children: React.ReactNode;
  banner?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky-50/60">
      {banner}
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-900 text-navy-100 md:flex">
          <div className="px-5 py-5">
            <Link href="/dashboard"><Logo light size="lg" withName /><span className="sr-only"> — go to dashboard</span></Link>
          </div>
          {tenantName && (
            <div className="mx-4 mb-3 rounded-lg bg-navy-800 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-navy-100/70">Organization</div>
              <div className="truncate text-sm font-semibold text-white" title={tenantName}>{tenantName}</div>
            </div>
          )}
          <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3">
            {nav.map((n) => {
              const Icon = ICONS[n.key] ?? LayoutDashboard;
              return (
                <NavLink key={n.key} href={n.href}>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{n.label}</span>
                  {n.key === "notifications" && unread > 0 && (
                    <span className="rounded-full bg-teal-700 px-1.5 text-[10px] font-bold text-white">{unread}</span>
                  )}
                </NavLink>
              );
            })}
            {isPlatformAdmin && (
              <>
                <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-navy-100/60">Platform</div>
                <NavLink href="/platform" exact>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Platform Console</span>
                </NavLink>
                <NavLink href="/platform/courses">
                  <BookOpen className="h-4 w-4" />
                  <span>Course Library</span>
                </NavLink>
                <NavLink href="/platform/regulatory">
                  <Scale className="h-4 w-4" />
                  <span>Regulatory Library</span>
                </NavLink>
                <NavLink href="/platform/programs">
                  <Award className="h-4 w-4" />
                  <span>Programs &amp; Approvals</span>
                </NavLink>
              </>
            )}
          </nav>
          <div className="border-t border-navy-800 p-4">
            <div className="truncate text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
            <div className="truncate text-xs text-navy-100/70">{roleNames.join(", ") || (isPlatformAdmin ? "Platform Super Administrator" : "")}</div>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="-mx-2 flex min-h-9 items-center gap-2 rounded px-2 text-xs font-medium text-navy-100 hover:text-white">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between bg-navy-900 px-4 py-3 md:hidden">
            <Link href="/dashboard"><Logo light size="sm" withName /></Link>
            <form action={logoutAction}><button className="min-h-9 rounded px-3 text-sm font-medium text-white" type="submit">Sign out</button></form>
          </header>
          <MobileNav items={[...nav.map((n) => ({ key: n.key, href: n.href, label: n.label, badge: n.key === "notifications" ? unread : undefined })), ...(isPlatformAdmin ? [{ key: "platform", href: "/platform", label: "Platform Console" }] : []), { key: "help", href: "/help", label: "Help" }]} />
          <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <SiteFooter className="px-4 pb-8 pt-2" />
        </div>
      </div>
    </div>
  );
}
