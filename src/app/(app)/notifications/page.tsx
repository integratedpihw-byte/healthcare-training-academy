import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { notifications } from "@/db/schema";
import { announcementOptions, listAnnouncements } from "@/lib/workforce/communication";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea, fmtDate, fmtDateTime } from "@/components/ui";
import { announceAction, markReadAction } from "./actions";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await requireTenant();
  const canAnnounce = ctx.can("notifications.announce");
  const d = await ctx.tx(async (tx) => ({
    rows: await tx.select().from(notifications).where(and(eq(notifications.userId, ctx.user.id))).orderBy(desc(notifications.createdAt)).limit(100),
    sent: canAnnounce ? await listAnnouncements(tx, 10) : [],
    opts: canAnnounce ? await announcementOptions(tx) : null,
  }));
  const unread = d.rows.filter((r) => !r.readAt).length;
  const allScope = ctx.can("notifications.announce", null);
  const facs = d.opts?.facilities.filter((f) => ctx.can("notifications.announce", f.id)) ?? [];
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Course assignments, reminders, results, expiration warnings and announcements for you."
        actions={
          <>
            <Link href="/settings/notifications" className="self-center text-sm text-slate-600 hover:underline">Email preferences</Link>
            {unread > 0 && <form action={markReadAction}><input type="hidden" name="id" value="all" /><Button variant="secondary" type="submit">Mark all as read</Button></form>}
          </>
        }
      />
      <div className={canAnnounce ? "grid gap-6 lg:grid-cols-[3fr_2fr]" : ""}>
        <Card>
          {d.rows.length === 0 ? <EmptyState>You have no notifications.</EmptyState> : (
            <ul className="divide-y divide-slate-100">
              {d.rows.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-medium text-navy-900">{n.title}</span>{!n.readAt && <Badge tone="teal">New</Badge>}</div>
                    <p className="text-sm text-slate-600">{n.body}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{fmtDateTime(n.createdAt)}{n.link && <> · <Link href={n.link} className="font-semibold text-teal-700 hover:underline">Open</Link></>}</p>
                  </div>
                  {!n.readAt && <form action={markReadAction}><input type="hidden" name="id" value={n.id} /><button className="text-xs font-semibold text-teal-700 hover:underline" type="submit">Mark read</button></form>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canAnnounce && d.opts && (
          <div className="space-y-6">
            <Card title="Send an announcement">
              <ActionForm action={announceAction} submitLabel="Send announcement" resetOnSuccess>
                <Field label="Title" name="title"><Input id="title" name="title" required maxLength={120} /></Field>
                <Field label="Message" name="body" hint="Delivered in the app and by email (per preferences). Do not include patient information."><Textarea id="body" name="body" rows={4} required maxLength={2000} /></Field>
                <Field label="Audience" name="audience">
                  <Select id="audience" name="audience" defaultValue={allScope ? "all" : "facility"}>
                    {allScope && <option value="all">Everyone in the organization</option>}
                    <option value="facility">Staff at a facility</option>
                    {allScope && <option value="role">Members with a role</option>}
                  </Select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Facility" name="facilityId"><Select id="facilityId" name="facilityId" defaultValue=""><option value="">—</option>{facs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></Field>
                  {allScope && <Field label="Role" name="roleId"><Select id="roleId" name="roleId" defaultValue=""><option value="">—</option>{d.opts.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>}
                </div>
              </ActionForm>
            </Card>
            <Card title="Recent announcements">
              {d.sent.length === 0 ? <p className="text-sm text-slate-600">None sent yet.</p> : (
                <ul className="space-y-2 text-sm">
                  {d.sent.map((a) => <li key={a.id}><div className="font-medium text-navy-900">{a.title}</div><div className="text-xs text-slate-500">{fmtDate(a.createdAt)} · {a.recipientCount} recipient{a.recipientCount === 1 ? "" : "s"}</div></li>)}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
