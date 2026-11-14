import { eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth/context";
import { instructors, users } from "@/db/schema";
import { myInstructor, type Credential } from "@/lib/instructors/service";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { InstructorNav } from "../nav";
import { saveProfileAction } from "../class-actions";

export const metadata = { title: "Instructor profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const ctx = await requireTenant();
  const { id } = await searchParams;
  const other = id && /^[0-9a-f-]{36}$/i.test(id) && ctx.can("instructors.manage") ? id : null;
  const row = await ctx.tx(async (tx) => {
    const i = other ? (await tx.select().from(instructors).where(eq(instructors.id, other)))[0] : await myInstructor(tx, { tenantId: ctx.tenant.id, userId: ctx.user.id });
    if (!i) return null;
    const [u] = await tx.select({ first: users.firstName, last: users.lastName }).from(users).where(eq(users.id, i.userId));
    return { i, u };
  });
  const creds = ((row?.i.credentials ?? []) as Credential[]).map((c) => [c.name, c.issuer, c.number ?? "", c.expiresOn ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");
  return (
    <>
      <PageHeader title="Instructor Portal" description={row ? `Profile for ${row.u.first} ${row.u.last}` : "Your instructor profile"} />
      <InstructorNav ctx={ctx} active="profile" />
      <Card title="Profile, qualifications and credentials" className="max-w-3xl">
        {!row ? <EmptyState>You do not have an instructor profile. Your training director can add you under Instructor Portal → Instructors.</EmptyState> : (
          <ActionForm action={saveProfileAction} submitLabel="Save profile" className="space-y-3">
            {other && <input type="hidden" name="instructorId" value={other} />}
            <Field label="Title" name="title" htmlFor="p-title"><Input id="p-title" name="title" defaultValue={row.i.title ?? ""} maxLength={120} /></Field>
            <Field label="Bio" name="bio" htmlFor="p-bio"><Textarea id="p-bio" name="bio" rows={4} defaultValue={row.i.bio ?? ""} maxLength={2000} /></Field>
            <Field label="Qualifications" name="qualifications" htmlFor="p-q" hint="One per line, e.g. “BSN, 12 years critical care”."><Textarea id="p-q" name="qualifications" rows={4} defaultValue={(row.i.qualifications ?? []).join("\n")} /></Field>
            <Field label="Credentials" name="credentials" htmlFor="p-c" hint="One per line: Name | Issuer | Number | Expiration (YYYY-MM-DD). Number and date are optional."><Textarea id="p-c" name="credentials" rows={4} defaultValue={creds} className="font-mono text-xs" /></Field>
            <p className="text-xs text-slate-500">Credentials listed here are self-reported or entered by your organization. Verify licenses with the issuing board before relying on them.</p>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
