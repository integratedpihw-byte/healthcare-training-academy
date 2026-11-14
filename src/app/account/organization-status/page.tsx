import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/context";
import { Alert, Card } from "@/components/ui";

export const metadata = { title: "Organization status" };

export default async function OrgStatus({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const ctx = await requireUser();
  const { registered } = await searchParams;
  if (!ctx.tenant) redirect("/account/no-organization");
  if (ctx.tenant.status === "ACTIVE") redirect("/dashboard");
  const t = ctx.tenant;
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">{t.name}</h1>
      <div className="mt-4 space-y-4 text-sm text-slate-700">
        {registered && <Alert tone="green">Registration received. Your workspace has been created.</Alert>}
        {t.status === "PENDING_APPROVAL" && (
          <>
            <Alert tone="blue">Your organization is awaiting review by a platform administrator. You will receive an email when it is approved.</Alert>
            <p>While you wait, you can <Link href="/settings/security" className="font-semibold text-teal-700 underline">turn on two-step verification</Link> for your administrator account.</p>
          </>
        )}
        {t.status === "REJECTED" && <Alert>Registration was not approved.{t.rejectionReason && ` Reason: ${t.rejectionReason}`}</Alert>}
        {t.status === "SUSPENDED" && <Alert>This organization is suspended.{t.rejectionReason && ` Reason: ${t.rejectionReason}`} Contact support to restore access.</Alert>}
        {t.status === "CLOSED" && <Alert>This organization has been closed.</Alert>}
        <p><Link href="/settings" className="text-teal-700 underline">Account settings</Link></p>
      </div>
    </Card>
  );
}
