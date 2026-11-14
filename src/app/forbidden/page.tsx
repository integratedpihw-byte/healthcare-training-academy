import Link from "next/link";
import { Card, Logo } from "@/components/ui";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <Card className="max-w-md">
        <Logo />
        <h1 className="mt-6 text-xl font-bold text-navy-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-700">Your role does not include permission for this page. If you need access, contact your organization administrator.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-teal-700 underline">Return to dashboard</Link>
      </Card>
    </main>
  );
}
