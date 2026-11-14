import Link from "next/link";
import { systemDb } from "@/db/server";
import { verifyEmail } from "@/lib/auth/service";
import { Alert, Logo } from "@/components/ui";

export const metadata = { title: "Email confirmation", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Landing page for the emailed confirmation link. */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const ok = await verifyEmail(systemDb(), String((await searchParams).token ?? ""));
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Logo />
        <h1 className="mt-6 text-xl font-bold text-navy-900">{ok ? "Email confirmed" : "This link did not work"}</h1>
        <div className="mt-3">
          {ok
            ? <Alert tone="green">Thank you. Your email address is confirmed.</Alert>
            : <Alert>The confirmation link is invalid or has expired. Sign in to request a new one.</Alert>}
        </div>
        <Link href="/dashboard" className="mt-5 inline-block rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">{ok ? "Continue" : "Sign in"}</Link>
      </div>
    </main>
  );
}
