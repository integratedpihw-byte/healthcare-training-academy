import Link from "next/link";
import { requireUser } from "@/lib/auth/context";
import { Alert, Card } from "@/components/ui";

export const metadata = { title: "No organization" };

export default async function NoOrg() {
  const ctx = await requireUser();
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">You are not part of an organization yet</h1>
      <p className="mt-2 text-sm text-slate-700">Ask your organization administrator to add you, or check your account settings if you belong to more than one organization.</p>
      {ctx.user.isPlatformAdmin && <div className="mt-4"><Alert tone="green">You are a platform administrator. <Link href="/platform" className="font-semibold underline">Open the Platform Console</Link> to review and approve organizations.</Alert></div>}
      <p className="mt-4 text-sm"><Link href="/settings" className="font-semibold text-teal-700 underline">Account settings</Link></p>
    </Card>
  );
}
