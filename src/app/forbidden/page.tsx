import Link from "next/link";
import { Card, Logo } from "@/components/ui";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <Card className="max-w-md">
        <Logo withName />
        <h1 className="mt-6 text-xl font-bold text-navy-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-700">Your role does not include permission for this page. If you need access, contact your organization administrator.</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><Link href="/dashboard" className="py-1 text-teal-700 underline">Return to dashboard</Link><Link href="/help" className="py-1 text-teal-700 underline">Help</Link></div>
      </Card>
    </main>
  );
}
